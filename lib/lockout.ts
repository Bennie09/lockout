import { catalogById } from '@/constants/catalog';
import {
  formatDuration,
  formatTime,
  inWindow,
  minutesOfDay,
  untilEnd,
  untilStart,
  weekday,
} from '@/lib/time';
import type { AppLockStatus, AppState, ConnectedApp, LockReason, LockoutWindow } from '@/store/types';

export function windowAppliesToday(window: LockoutWindow, date: Date) {
  if (!window.enabled) return false;
  if (window.days.length === 0) return true;
  return window.days.includes(weekday(date) as 0 | 1 | 2 | 3 | 4 | 5 | 6);
}

export function activeWindows(windows: LockoutWindow[], date: Date) {
  const now = minutesOfDay(date);
  return windows.filter((window) => windowAppliesToday(window, date) && inWindow(now, window.start, window.end));
}

export function statusForApp(state: AppState, app: ConnectedApp, date = new Date()): AppLockStatus {
  if (!app.connected) {
    return { id: app.id, locked: false, reasons: [], nextEvent: null };
  }

  const reasons: LockReason[] = [];

  if (state.universalEnabled) {
    for (const window of activeWindows(state.universalWindows, date)) {
      reasons.push({ kind: 'universal', window });
    }
  }

  for (const window of activeWindows(app.windows, date)) {
    reasons.push({ kind: 'window', window });
  }

  if (app.dailyLimitMinutes != null && app.usedSecondsToday >= app.dailyLimitMinutes * 60) {
    reasons.push({
      kind: 'limit',
      used: Math.floor(app.usedSecondsToday / 60),
      cap: app.dailyLimitMinutes,
    });
  }

  if (app.cooldownUntil > date.getTime()) {
    reasons.push({ kind: 'cooldown', until: app.cooldownUntil });
  } else if (
    app.scrollCapMinutes != null &&
    app.sittingSeconds >= app.scrollCapMinutes * 60
  ) {
    reasons.push({
      kind: 'scroll',
      sitting: Math.floor(app.sittingSeconds / 60),
      cap: app.scrollCapMinutes,
    });
  }

  return {
    id: app.id,
    locked: reasons.length > 0,
    reasons,
    nextEvent: nextEventForApp(state, app, date),
  };
}

export function allStatuses(state: AppState, date = new Date()) {
  return state.apps.filter((app) => app.connected).map((app) => statusForApp(state, app, date));
}

export function anythingLocked(state: AppState, date = new Date()) {
  return allStatuses(state, date).some((status) => status.locked);
}

export function isProtectedEdit(state: AppState, appId: string | 'universal', date = new Date()) {
  if (Date.now() < (globalGraceUntil || 0)) return false;
  if (appId === 'universal') return anythingLocked(state, date) && state.universalEnabled;
  const app = state.apps.find((item) => item.id === appId);
  if (!app) return anythingLocked(state, date);
  return statusForApp(state, app, date).locked || (state.universalEnabled && activeWindows(state.universalWindows, date).length > 0);
}

let globalGraceUntil = 0;

export function grantEditGrace(ms = 3 * 60 * 1000) {
  globalGraceUntil = Date.now() + ms;
}

export function hasEditGrace() {
  return Date.now() < globalGraceUntil;
}

export function reasonCopy(reason: LockReason) {
  if (reason.kind === 'universal') {
    return `Universal · ${reason.window.label || 'Lockout'} · ${formatTime(reason.window.start)} – ${formatTime(reason.window.end)}`;
  }
  if (reason.kind === 'window') {
    return `${reason.window.label || 'Lockout'} · ${formatTime(reason.window.start)} – ${formatTime(reason.window.end)}`;
  }
  if (reason.kind === 'limit') {
    return `Daily cap reached · ${formatDuration(reason.used)} of ${formatDuration(reason.cap)}`;
  }
  if (reason.kind === 'scroll') {
    return `Sitting cap · ${formatDuration(reason.sitting)} of ${formatDuration(reason.cap)} this scroll`;
  }
  const wait = Math.max(1, Math.ceil((reason.until - Date.now()) / 60000));
  return `Cool-down · ${formatDuration(wait)} left before the next sitting`;
}

export function lockHeadline(status: AppLockStatus) {
  if (!status.locked) return 'Open';
  if (status.reasons.some((reason) => reason.kind === 'cooldown')) return 'Cool-down';
  if (status.reasons.some((reason) => reason.kind === 'scroll')) return 'Sitting cap';
  if (status.reasons.some((reason) => reason.kind === 'limit')) return 'Cap hit';
  if (status.reasons.some((reason) => reason.kind === 'universal')) return 'Universal';
  return 'Locked out';
}

export function nextEventForApp(state: AppState, app: ConnectedApp, date: Date) {
  const now = minutesOfDay(date);
  const candidates: { kind: 'starts' | 'ends'; atMinutes: number; label: string }[] = [];
  const windows: { window: LockoutWindow; source: string }[] = [
    ...app.windows.map((window) => ({ window, source: catalogById(app.id)?.name ?? app.id })),
    ...(state.universalEnabled
      ? state.universalWindows.map((window) => ({ window, source: 'Universal' }))
      : []),
  ];

  for (const { window, source } of windows) {
    if (!windowAppliesToday(window, date) && window.days.length > 0) continue;
    const active = windowAppliesToday(window, date) && inWindow(now, window.start, window.end);
    if (active) {
      candidates.push({
        kind: 'ends',
        atMinutes: untilEnd(now, window.end),
        label: `${source} until ${formatTime(window.end)}`,
      });
    } else if (window.enabled) {
      candidates.push({
        kind: 'starts',
        atMinutes: untilStart(now, window.start),
        label: `${window.label || source} at ${formatTime(window.start)}`,
      });
    }
  }

  candidates.sort((a, b) => a.atMinutes - b.atMinutes);
  return candidates[0] ?? null;
}

export function todaysSchedule(state: AppState, date = new Date()) {
  const rows: {
    id: string;
    start: string;
    end: string;
    label: string;
    source: string;
    active: boolean;
  }[] = [];

  if (state.universalEnabled) {
    for (const window of state.universalWindows) {
      if (!windowAppliesToday(window, date) && !window.enabled) continue;
      if (!window.enabled) continue;
      if (window.days.length > 0 && !windowAppliesToday(window, date)) continue;
      rows.push({
        id: window.id,
        start: window.start,
        end: window.end,
        label: window.label || 'Universal lockout',
        source: 'Everyone',
        active: inWindow(minutesOfDay(date), window.start, window.end),
      });
    }
  }

  for (const app of state.apps.filter((item) => item.connected)) {
    const name = catalogById(app.id)?.name ?? app.id;
    for (const window of app.windows) {
      if (!window.enabled) continue;
      if (window.days.length > 0 && !windowAppliesToday(window, date)) continue;
      rows.push({
        id: window.id,
        start: window.start,
        end: window.end,
        label: window.label || name,
        source: name,
        active: inWindow(minutesOfDay(date), window.start, window.end),
      });
    }
  }

  return rows.sort((a, b) => a.start.localeCompare(b.start));
}

import { CATALOG } from '@/constants/catalog';
import { nid } from '@/lib/id';
import { todayKey } from '@/lib/time';
import type { Activity, AppState, ConnectedApp, LockoutWindow, Security } from '@/store/types';

export function normalizeApp(app: Partial<ConnectedApp> & { id: string }): ConnectedApp {
  return {
    ...emptyApp(app.id),
    ...app,
    scrollCapMinutes: app.scrollCapMinutes ?? 10,
    cooldownMinutes: app.cooldownMinutes ?? 10,
    cooldownUntil: app.cooldownUntil ?? 0,
    usedSecondsToday: app.usedSecondsToday ?? (app.usedMinutesToday ?? 0) * 60,
    sittingSeconds: app.sittingSeconds ?? 0,
    lockMessage: app.lockMessage ?? '',
  };
}

export function emptyApp(id: string): ConnectedApp {
  return {
    id,
    connected: false,
    dailyLimitMinutes: 120,
    scrollCapMinutes: 10,
    cooldownMinutes: 10,
    cooldownUntil: 0,
    windows: [],
    usedMinutesToday: 0,
    usedSecondsToday: 0,
    sittingSeconds: 0,
    lockMessage: '',
  };
}

export function createInitialState(): AppState {
  return {
    onboarded: false,
    fastUsage: false,
    apps: CATALOG.map((app) => emptyApp(app.id)),
    universalEnabled: true,
    universalWindows: [],
    security: {
      pinHash: '',
      passwordHash: '',
      secretWordHash: '',
      biometricsEnabled: true,
    },
    activity: [],
    streakDays: 0,
    minutesSaved: 0,
    lastResetDate: todayKey(),
    lastActiveDate: todayKey(),
    lockMessage: '',
  };
}

export function suggestedNightWindow(): LockoutWindow {
  return {
    id: nid('w_'),
    start: '00:00',
    end: '07:00',
    label: 'Night',
    days: [],
    enabled: true,
  };
}

export function pushActivity(state: AppState, entry: Omit<Activity, 'id' | 'at'>): AppState {
  const next: Activity = { ...entry, id: nid('a_'), at: Date.now() };
  return { ...state, activity: [next, ...state.activity].slice(0, 30) };
}

export function rollDay(state: AppState, now = new Date()): AppState {
  const key = todayKey(now);
  if (state.lastResetDate === key) return state;

  const stayedUnder = state.apps
    .filter((app) => app.connected && app.dailyLimitMinutes != null)
    .every((app) => app.usedMinutesToday <= (app.dailyLimitMinutes ?? Infinity));

  const yesterdayWasYesterday =
    state.lastActiveDate !== key && state.onboarded;

  return {
    ...state,
    lastResetDate: key,
    lastActiveDate: key,
    streakDays: yesterdayWasYesterday && stayedUnder ? state.streakDays + 1 : stayedUnder ? state.streakDays : 0,
    apps: state.apps.map((app) => ({
      ...app,
      usedMinutesToday: 0,
      usedSecondsToday: 0,
      sittingSeconds: 0,
      cooldownUntil: 0,
    })),
  };
}

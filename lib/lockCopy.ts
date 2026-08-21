import type { AppState, ConnectedApp } from '@/store/types';

export const LOCK_COPY_MAX = 80;

export const LOCK_COPY_PRESETS = [
  'Go walk.',
  'Go outside.',
  'Drink water.',
  'Put the phone down.',
  'Call someone.',
  'Make something.',
] as const;

export function normalizeLockCopy(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, LOCK_COPY_MAX);
}

export function lockScreenLine(state: AppState, app?: ConnectedApp | null, appName?: string) {
  const custom = normalizeLockCopy(app?.lockMessage ?? '') || normalizeLockCopy(state.lockMessage);
  if (custom) return custom;
  return `${appName ?? 'This app'} stays closed.`;
}

export function lockScreenHasCustom(state: AppState, app?: ConnectedApp | null) {
  return Boolean(normalizeLockCopy(app?.lockMessage ?? '') || normalizeLockCopy(state.lockMessage));
}

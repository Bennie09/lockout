import { requireOptionalNativeModule } from 'expo';

type BlockedPayload = {
  appId: string;
  packageName: string;
  reason?: string;
  cooldownUntil?: number;
};

export type UsageRow = {
  usedSeconds: number;
  sittingSeconds: number;
  cooldownUntil: number;
};

export type UsageSnapshot = {
  date: string;
  apps: Record<string, UsageRow>;
};

export type WatchApp = {
  appId: string;
  packages: string[];
  dailyLimitMinutes: number | null;
  scrollCapMinutes: number | null;
  cooldownMinutes: number | null;
};

type NativeGuard = {
  isAppInstalled(packageName: string): boolean;
  hasUsageAccess(): boolean;
  openAppInfo(): void;
  openUsageAccessSettings(): void;
  hasOverlayPermission(): boolean;
  openOverlaySettings(): void;
  isIgnoringBatteryOptimizations(): boolean;
  requestIgnoreBatteryOptimizations(): void;
  setBlocked(json: string): void;
  setWatch(json: string): void;
  setFast(enabled: boolean): void;
  getUsageSnapshot(): UsageSnapshot;
  startGuard(): void;
  stopGuard(): void;
  addListener?(event: 'onBlocked', listener: (event: BlockedPayload) => void): { remove: () => void };
};

const native = requireOptionalNativeModule<NativeGuard>('LockoutGuard');

export const guardAvailable = Boolean(native);

export function isAppInstalled(packageName: string) {
  return native?.isAppInstalled(packageName) ?? false;
}

export function hasUsageAccess() {
  return native?.hasUsageAccess() ?? false;
}

export function openAppInfo() {
  native?.openAppInfo();
}

export function openUsageAccessSettings() {
  native?.openUsageAccessSettings();
}

export function hasOverlayPermission() {
  return native?.hasOverlayPermission() ?? false;
}

export function openOverlaySettings() {
  native?.openOverlaySettings();
}

export function isIgnoringBatteryOptimizations() {
  return native?.isIgnoringBatteryOptimizations() ?? true;
}

export function requestIgnoreBatteryOptimizations() {
  native?.requestIgnoreBatteryOptimizations();
}

export function setBlocked(entries: { packageName: string; appId: string }[]) {
  native?.setBlocked(JSON.stringify(entries));
}

export function setWatch(apps: WatchApp[]) {
  native?.setWatch(
    JSON.stringify(
      apps.map((app) => ({
        appId: app.appId,
        packages: app.packages,
        dailyLimitMinutes: app.dailyLimitMinutes ?? -1,
        scrollCapMinutes: app.scrollCapMinutes ?? -1,
        cooldownMinutes: app.cooldownMinutes ?? -1,
      })),
    ),
  );
}

export function setFast(enabled: boolean) {
  native?.setFast(enabled);
}

export function getUsageSnapshot(): UsageSnapshot {
  const snap = native?.getUsageSnapshot();
  if (!snap || typeof snap !== 'object') return { date: '', apps: {} };
  return {
    date: String(snap.date ?? ''),
    apps: (snap.apps as UsageSnapshot['apps']) ?? {},
  };
}

export function startGuard() {
  native?.startGuard();
}

export function stopGuard() {
  native?.stopGuard();
}

export function subscribeBlocked(handler: (payload: BlockedPayload) => void) {
  if (!native?.addListener) return () => {};
  const sub = native.addListener('onBlocked', handler);
  return () => sub.remove();
}

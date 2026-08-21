import { requireOptionalNativeModule } from 'expo';

type BlockedPayload = { appId: string; packageName: string };

type NativeGuard = {
  isAppInstalled(packageName: string): boolean;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  hasOverlayPermission(): boolean;
  openOverlaySettings(): void;
  isIgnoringBatteryOptimizations(): boolean;
  requestIgnoreBatteryOptimizations(): void;
  setBlocked(json: string): void;
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

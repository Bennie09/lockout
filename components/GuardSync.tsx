import { CATALOG } from '@/constants/catalog';
import { statusForApp } from '@/lib/lockout';
import { useClock } from '@/lib/useClock';
import { useStore } from '@/store/StoreProvider';
import {
  getUsageSnapshot,
  guardAvailable,
  hasUsageAccess,
  setBlocked,
  setFast,
  setWatch,
  startGuard,
  stopGuard,
  subscribeBlocked,
} from 'lockout-guard';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function GuardSync() {
  const { state, dispatch } = useStore();
  const now = useClock(2000);
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android' || !guardAvailable) return;
    return subscribeBlocked(({ appId }) => {
      router.push(`/locked/${appId}`);
    });
  }, [router]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !guardAvailable) return;
    if (!state.onboarded) {
      stopGuard();
      return;
    }

    const connected = state.apps.filter((app) => app.connected);
    const watch = connected.map((app) => {
      const meta = CATALOG.find((item) => item.id === app.id);
      return {
        appId: app.id,
        packages: meta?.androidPackages ?? [],
        dailyLimitMinutes: app.dailyLimitMinutes,
        scrollCapMinutes: app.scrollCapMinutes,
        cooldownMinutes: app.cooldownMinutes,
      };
    });

    const blocked: { packageName: string; appId: string }[] = [];
    for (const app of connected) {
      if (!statusForApp(state, app, now).locked) continue;
      const meta = CATALOG.find((item) => item.id === app.id);
      if (!meta) continue;
      for (const packageName of meta.androidPackages) {
        blocked.push({ packageName, appId: app.id });
      }
    }

    setFast(state.fastUsage);
    setWatch(watch);
    setBlocked(blocked);

    if (connected.length > 0 && hasUsageAccess()) {
      startGuard();
    } else {
      stopGuard();
    }
  }, [now, state]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !guardAvailable || !state.onboarded) return;
    const snap = getUsageSnapshot();
    const apps: Record<string, { usedSeconds: number; sittingSeconds: number; cooldownUntil: number }> = {};
    for (const [id, row] of Object.entries(snap.apps ?? {})) {
      apps[id] = {
        usedSeconds: Number(row?.usedSeconds) || 0,
        sittingSeconds: Number(row?.sittingSeconds) || 0,
        cooldownUntil: Number(row?.cooldownUntil) || 0,
      };
    }
    dispatch({ type: 'SYNC_USAGE', apps });
  }, [dispatch, now, state.onboarded]);

  return null;
}

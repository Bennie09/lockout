import { CATALOG } from '@/constants/catalog';
import { statusForApp } from '@/lib/lockout';
import { useClock } from '@/lib/useClock';
import { useStore } from '@/store/StoreProvider';
import {
  guardAvailable,
  hasUsageAccess,
  setBlocked,
  startGuard,
  stopGuard,
  subscribeBlocked,
} from 'lockout-guard';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function GuardSync() {
  const { state, dispatch } = useStore();
  const now = useClock(8000);
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android' || !guardAvailable) return;
    return subscribeBlocked(({ appId }) => {
      dispatch({
        type: 'LOG',
        title: 'Closed a locked app',
        detail: appId,
        tone: 'lock',
      });
      dispatch({ type: 'ADD_SAVED', minutes: 2 });
      router.push(`/locked/${appId}`);
    });
  }, [dispatch, router]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !guardAvailable) return;
    if (!state.onboarded) {
      stopGuard();
      return;
    }

    const entries: { packageName: string; appId: string }[] = [];
    for (const app of state.apps) {
      if (!app.connected) continue;
      if (!statusForApp(state, app, now).locked) continue;
      const meta = CATALOG.find((item) => item.id === app.id);
      if (!meta) continue;
      for (const packageName of meta.androidPackages) {
        entries.push({ packageName, appId: app.id });
      }
    }

    setBlocked(entries);
    if (entries.length > 0 && hasUsageAccess()) {
      startGuard();
    } else {
      stopGuard();
    }
  }, [now, state]);

  return null;
}

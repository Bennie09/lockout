import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { UsageAccessGuide } from '@/components/UsageAccessGuide';
import { colors, radius, space } from '@/constants/theme';
import {
  guardAvailable,
  hasOverlayPermission,
  hasUsageAccess,
  isIgnoringBatteryOptimizations,
  openOverlaySettings,
  requestIgnoreBatteryOptimizations,
} from 'lockout-guard';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';

type Perms = {
  usage: boolean;
  overlay: boolean;
  battery: boolean;
  notify: boolean;
};

async function notificationGranted() {
  if (Platform.OS !== 'android') return true;
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return true;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  } catch {
    return true;
  }
}

export default function Access() {
  const router = useRouter();
  const [perms, setPerms] = useState<Perms>({ usage: false, overlay: false, battery: true, notify: true });

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'android' || !guardAvailable) {
      setPerms({ usage: true, overlay: true, battery: true, notify: true });
      return;
    }
    setPerms({
      usage: hasUsageAccess(),
      overlay: hasOverlayPermission(),
      battery: isIgnoringBatteryOptimizations(),
      notify: await notificationGranted(),
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      router.replace('/onboarding/ready');
      return;
    }
    void refresh();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh, router]);

  async function askNotify() {
    if (Platform.OS !== 'android') return;
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    await refresh();
  }

  const ready = perms.usage;

  return (
    <Screen scroll extraBottom={40}>
      <Type variant="caption" color={colors.brass}>
        Step 3 of 4
      </Type>
      <Type variant="display" style={styles.title}>
        Android has to allow the lock.
      </Type>
      <Type style={styles.lede}>
        Connecting Instagram does not log you in. It tells Lockout which app to close. Usage access is the one that
        matters — without it, Lockout cannot see that Instagram is in front.
      </Type>

      <UsageAccessGuide granted={perms.usage} />
      <PermRow
        title="Display over other apps"
        body="Helps on some phones when Android blocks Lockout from jumping in front."
        ok={perms.overlay}
        label={perms.overlay ? 'Granted' : 'Allow overlay'}
        onPress={openOverlaySettings}
      />
      <PermRow
        title="Ignore battery limits"
        body="Stops Android from freezing the watcher while the screen is off."
        ok={perms.battery}
        label={perms.battery ? 'Unrestricted' : 'Allow'}
        onPress={requestIgnoreBatteryOptimizations}
      />
      <PermRow
        title="Notifications"
        body="The watcher runs as a quiet ongoing notice so Android does not kill it."
        ok={perms.notify}
        label={perms.notify ? 'Granted' : 'Allow'}
        onPress={() => void askNotify()}
      />

      <Button
        label={ready ? 'Continue' : 'Usage access is required'}
        disabled={!ready}
        style={{ marginTop: space.md }}
        onPress={() => router.push('/onboarding/ready')}
      />
      <Button label="I’ll do this later" variant="quiet" style={{ marginTop: 8 }} onPress={() => router.push('/onboarding/ready')} />
      <Type variant="caption" style={{ marginTop: 8 }}>
        You can grant these anytime under You. Until usage access is on, lockout only works inside this app.
      </Type>
    </Screen>
  );
}

function PermRow({
  title,
  body,
  ok,
  label,
  onPress,
}: {
  title: string;
  body: string;
  ok: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Type variant="bodyStrong">{title}</Type>
        <Type variant="caption" style={{ marginTop: 4 }}>
          {body}
        </Type>
        <Type variant="caption" color={ok ? colors.sage : colors.terracotta} style={{ marginTop: 6 }}>
          {ok ? 'Ready' : 'Not granted'}
        </Type>
      </View>
      <Button label={label} variant={ok ? 'ghost' : 'primary'} onPress={onPress} style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8, marginBottom: 8 },
  lede: { marginBottom: space.lg },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  btn: { minWidth: 118, paddingHorizontal: 12 },
});

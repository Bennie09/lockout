import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LockCopyEditor } from '@/components/LockCopyEditor';
import { LockMark } from '@/components/LockMark';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { UsageAccessGuide } from '@/components/UsageAccessGuide';
import { colors, space } from '@/constants/theme';
import {
  guardAvailable,
  hasOverlayPermission,
  hasUsageAccess,
  isIgnoringBatteryOptimizations,
  openOverlaySettings,
  requestIgnoreBatteryOptimizations,
} from 'lockout-guard';
import { SECRET_COPY, wipeAuthMaterial, type SecretKind } from '@/lib/secrets';
import { useStore } from '@/store/StoreProvider';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Switch, View } from 'react-native';

export default function YouTab() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const first = state.apps.find((app) => app.connected)?.id ?? 'instagram';
  const [usage, setUsage] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [battery, setBattery] = useState(true);

  const refreshAccess = useCallback(() => {
    if (!guardAvailable) return;
    setUsage(hasUsageAccess());
    setOverlay(hasOverlayPermission());
    setBattery(isIgnoringBatteryOptimizations());
  }, []);

  useEffect(() => {
    refreshAccess();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refreshAccess();
    });
    return () => sub.remove();
  }, [refreshAccess]);

  function edit(kind: SecretKind) {
    router.push({ pathname: '/security-edit', params: { kind } });
  }

  return (
    <Screen scroll extraBottom={40}>
      <View style={styles.brand}>
        <LockMark size={28} />
        <View>
          <Type variant="display" style={{ fontSize: 32 }}>
            You
          </Type>
          <Type variant="caption">The lock is only as honest as the person who set it.</Type>
        </View>
      </View>

      <Card padded={false}>
        <View style={styles.cardPad}>
          <Type variant="bodyStrong">Security gates</Type>
          <Type variant="caption" style={{ marginTop: 4 }}>
            Fingerprint {state.security.biometricsEnabled ? 'on' : 'off'} · if a PIN, password, or word never matches,
            recover with fingerprint and set it again. Do not wipe the app for that.
          </Type>
        </View>
        {(['pin', 'password', 'word'] as SecretKind[]).map((kind) => (
          <Pressable
            key={kind}
            onPress={() => edit(kind)}
            style={styles.row}>
            <View style={{ flex: 1 }}>
              <Type variant="label">{SECRET_COPY[kind].title}</Type>
              <Type variant="caption">{SECRET_COPY[kind].kicker} · tap to update</Type>
            </View>
            <ChevronRight size={16} color={colors.brass} />
          </Pressable>
        ))}
        <View style={styles.cardPad}>
          <Button
            label="Preview the long lock"
            variant="ghost"
            onPress={() =>
              router.push({ pathname: '/challenge', params: { next: '/(tabs)/you', target: 'universal', preview: '1' } })
            }
          />
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Type variant="bodyStrong">Lock screen</Type>
        <Type variant="caption" style={{ marginTop: 4, marginBottom: 12 }}>
          When Instagram (or any connected app) gets closed, this is what you tell yourself. Per-app lines on each
          control screen override this.
        </Type>
        <LockCopyEditor
          value={state.lockMessage}
          onChange={(message) => dispatch({ type: 'SET_LOCK_MESSAGE', target: 'universal', message })}
          placeholder="Go walk."
          hint="A short order to yourself. Not a quote. A next action."
        />
        <Button
          label="Show locked-out screen"
          variant="ghost"
          style={{ marginTop: 12 }}
          onPress={() => router.push(`/locked/${first}`)}
        />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Type variant="bodyStrong">Fast demo usage</Type>
            <Type variant="caption">
              1 second on Instagram counts as 1 minute, so you can test the daily cap and sitting cap without waiting.
            </Type>
          </View>
          <Switch
            value={state.fastUsage}
            onValueChange={(enabled) => dispatch({ type: 'SET_FAST', enabled })}
            trackColor={{ false: '#2A2723', true: colors.brassDim }}
            thumbColor={state.fastUsage ? colors.brass : colors.muted}
          />
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Type variant="bodyStrong">Android access</Type>
        <Type variant="caption" style={{ marginTop: 4, marginBottom: 12 }}>
          {guardAvailable
            ? 'Because this APK is sideloaded, Android locks Usage access until you allow restricted settings from App info.'
            : 'This build cannot talk to other apps. Install the Android APK, not Expo Go, for a real lockout.'}
        </Type>
        {guardAvailable ? (
          <View style={{ gap: 8 }}>
            <UsageAccessGuide granted={usage} embedded />
            <Button
              label={overlay ? 'Overlay on' : 'Allow overlay'}
              variant="ghost"
              onPress={openOverlaySettings}
            />
            <Button
              label={battery ? 'Battery unrestricted' : 'Ignore battery limits'}
              variant="ghost"
              onPress={requestIgnoreBatteryOptimizations}
            />
          </View>
        ) : null}
      </Card>

      <Button
        label="Reset Lockout"
        variant="danger"
        style={{ marginTop: space.lg }}
        onPress={() => {
          if (state.onboarded) {
            router.push({ pathname: '/challenge', params: { next: '/reset', target: 'universal' } });
            return;
          }
          void wipeAuthMaterial().then(() => dispatch({ type: 'RESET' }));
        }}
      />
      <Type variant="caption" style={{ marginTop: 8, textAlign: 'center' }}>
        Resetting during a lockout still takes the long lock. That wipe is not how you recover a forgotten PIN.
      </Type>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: space.lg, marginTop: 6 },
  switchRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  cardPad: { padding: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LockMark } from '@/components/LockMark';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { colors, radius, space } from '@/constants/theme';
import { useStore } from '@/store/StoreProvider';
import { useRouter } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

export default function YouTab() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const first = state.apps.find((app) => app.connected)?.id ?? 'instagram';

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

      <Card>
        <Type variant="bodyStrong">Security gates</Type>
        <Type variant="caption" style={{ marginTop: 4, marginBottom: 12 }}>
          Fingerprint {state.security.biometricsEnabled ? 'on' : 'off'} · 6-digit PIN · password · secret word · a reason.
        </Type>
        <Button
          label="Preview the long lock"
          variant="ghost"
          onPress={() =>
            router.push({ pathname: '/challenge', params: { next: '/(tabs)/you', target: 'universal', preview: '1' } })
          }
        />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Type variant="bodyStrong">Preview a lockout</Type>
        <Type variant="caption" style={{ marginTop: 4, marginBottom: 12 }}>
          See the screen you get when an app is inside a window or over its cap.
        </Type>
        <Button label="Show locked-out screen" variant="ghost" onPress={() => router.push(`/locked/${first}`)} />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Type variant="bodyStrong">Fast demo usage</Type>
            <Type variant="caption">In a session, 1 second counts as 1 minute so you can test caps tonight.</Type>
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
        <Type variant="bodyStrong">Expo Go note</Type>
        <Type variant="caption" style={{ marginTop: 6 }}>
          Lockout in Expo Go can run the full control panel, timers, and the long lock. Closing Instagram from outside this
          app needs a later Android build with usage-access. Until then, start a session from an app page to feel the lock.
        </Type>
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
          dispatch({ type: 'RESET' });
        }}
      />
      <Type variant="caption" style={{ marginTop: 8, textAlign: 'center' }}>
        Resetting during a lockout still takes the long lock.
      </Type>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: space.lg, marginTop: 6 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});

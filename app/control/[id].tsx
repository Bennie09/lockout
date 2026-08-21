import { AppBadge } from '@/components/AppBadge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Type } from '@/components/Type';
import { WindowRow } from '@/components/WindowRow';
import { catalogById } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { reasonCopy, statusForApp } from '@/lib/lockout';
import { formatSeconds } from '@/lib/time';
import { useClock } from '@/lib/useClock';
import { useStore } from '@/store/StoreProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

const LIMITS: { label: string; minutes: number | null }[] = [
  { label: 'Off', minutes: null },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
  { label: '5h', minutes: 300 },
];

const SITTINGS: { label: string; minutes: number | null }[] = [
  { label: 'Off', minutes: null },
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '15m', minutes: 15 },
  { label: '20m', minutes: 20 },
  { label: '30m', minutes: 30 },
];

export default function Control() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const now = useClock();
  const { state, dispatch, requireChallenge } = useStore();
  const app = state.apps.find((item) => item.id === id);
  const meta = catalogById(id ?? '');

  if (!app || !meta) {
    return (
      <Screen>
        <Type>Unknown app.</Type>
      </Screen>
    );
  }

  const appId = app.id;
  const status = statusForApp(state, app, now);

  function guarded(next: string) {
    if (requireChallenge(appId)) {
      router.push({ pathname: '/challenge', params: { next, target: appId } });
      return;
    }
    router.push(next as never);
  }

  return (
    <Screen scroll extraBottom={40}>
      <Pressable onPress={() => router.back()}>
        <Type variant="caption" color={colors.brass}>
          Back
        </Type>
      </Pressable>
      <View style={styles.head}>
        <AppBadge id={app.id} size={56} />
        <View style={{ flex: 1 }}>
          <Type variant="display" style={{ fontSize: 32 }}>
            {meta.name}
          </Type>
          <Type variant="caption">{meta.tagline}</Type>
        </View>
      </View>

      <Card hot={status.locked}>
        <Type variant="section">{status.locked ? 'Locked out' : 'Available'}</Type>
        <Type variant="title" style={{ marginTop: 6 }}>
          {status.locked ? 'This one stays closed.' : 'Open it on the phone. Lockout counts the real minutes.'}
        </Type>
        {status.reasons.map((reason, i) => (
          <Type key={i} variant="caption" style={{ marginTop: 6 }}>
            {reasonCopy(reason)}
          </Type>
        ))}
        {status.nextEvent && !status.locked ? (
          <Type variant="caption" style={{ marginTop: 6 }}>
            Next: {status.nextEvent.label}
          </Type>
        ) : null}
        {status.locked ? (
          <Button
            label="I still want in"
            style={{ marginTop: 14 }}
            variant="danger"
            onPress={() => router.push(`/locked/${app.id}`)}
          />
        ) : null}
      </Card>

      <SectionHeader title="Daily cap" aside={formatSeconds(app.usedSecondsToday) + ' used'} />
      <View style={styles.chips}>
        {LIMITS.map((item) => {
          const on = app.dailyLimitMinutes === item.minutes;
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                if (requireChallenge(app.id)) {
                  router.push({ pathname: '/challenge', params: { next: `/control/${app.id}`, target: app.id } });
                  return;
                }
                dispatch({ type: 'SET_LIMIT', id: app.id, minutes: item.minutes });
              }}
              style={[styles.chip, on && styles.chipOn]}>
              <Type variant="label" color={on ? colors.bg : colors.cream}>
                {item.label}
              </Type>
            </Pressable>
          );
        })}
      </View>
      <Type variant="caption">When the cap is hit, this app stays closed until midnight. Real phone time counts, not a timer inside Lockout.</Type>

      <SectionHeader
        title="Sitting cap"
        aside={app.sittingSeconds > 0 ? formatSeconds(app.sittingSeconds) + ' this scroll' : 'one stretch'}
      />
      <View style={styles.chips}>
        {SITTINGS.map((item) => {
          const on = app.scrollCapMinutes === item.minutes;
          return (
            <Pressable
              key={`sit-${item.label}`}
              onPress={() => {
                if (requireChallenge(app.id)) {
                  router.push({ pathname: '/challenge', params: { next: `/control/${app.id}`, target: app.id } });
                  return;
                }
                dispatch({ type: 'SET_SCROLL_CAP', id: app.id, minutes: item.minutes });
              }}
              style={[styles.chip, on && styles.chipOn]}>
              <Type variant="label" color={on ? colors.bg : colors.cream}>
                {item.label}
              </Type>
            </Pressable>
          );
        })}
      </View>
      <Type variant="caption">
        A sitting is one unbroken scroll. After this, Lockout kicks you out even if daily time is left.
      </Type>

      <SectionHeader title="Cool-down" aside="then wait" />
      <View style={styles.chips}>
        {SITTINGS.map((item) => {
          const on = app.cooldownMinutes === item.minutes;
          return (
            <Pressable
              key={`cd-${item.label}`}
              onPress={() => {
                if (requireChallenge(app.id)) {
                  router.push({ pathname: '/challenge', params: { next: `/control/${app.id}`, target: app.id } });
                  return;
                }
                dispatch({ type: 'SET_COOLDOWN', id: app.id, minutes: item.minutes });
              }}
              style={[styles.chip, on && styles.chipOn]}>
              <Type variant="label" color={on ? colors.bg : colors.cream}>
                {item.label}
              </Type>
            </Pressable>
          );
        })}
      </View>
      <Type variant="caption" style={{ marginBottom: 8 }}>
        After a sitting, you wait this long before another sitting. Both sittings still count toward the daily cap.
      </Type>

      <SectionHeader title="Lockout windows" aside={`${app.windows.length}`} />
      <Card padded={false}>
        {app.windows.length === 0 ? (
          <Type variant="caption" style={{ padding: space.md }}>
            No private hours yet. Universal windows still apply.
          </Type>
        ) : (
          app.windows.map((window) => (
            <WindowRow
              key={window.id}
              label={window.label || 'Lockout'}
              start={window.start}
              end={window.end}
              enabled={window.enabled}
              onPress={() => guarded(`/window-editor?target=${app.id}&windowId=${window.id}`)}
              onToggle={() => {
                if (requireChallenge(app.id)) {
                  router.push({ pathname: '/challenge', params: { next: `/control/${app.id}`, target: app.id } });
                  return;
                }
                dispatch({ type: 'TOGGLE_WINDOW', target: app.id, windowId: window.id });
              }}
            />
          ))
        )}
      </Card>
      <Button
        label="Add a window"
        variant="ghost"
        style={{ marginTop: 10 }}
        onPress={() => guarded(`/window-editor?target=${app.id}`)}
      />

      <Button
        label={app.connected ? 'Disconnect this app' : 'Connect'}
        variant="quiet"
        style={{ marginTop: space.lg }}
        onPress={() => {
          if (app.connected && requireChallenge(app.id)) {
            router.push({ pathname: '/challenge', params: { next: `/control/${app.id}`, target: app.id } });
            return;
          }
          dispatch({ type: 'SET_CONNECTED', id: app.id, connected: !app.connected });
          if (app.connected) router.replace('/(tabs)/apps');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.brass, borderColor: colors.brass },
});

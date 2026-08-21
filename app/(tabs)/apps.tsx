import { AppBadge } from '@/components/AppBadge';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { CATALOG } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { statusForApp } from '@/lib/lockout';
import { formatDuration } from '@/lib/time';
import { useClock } from '@/lib/useClock';
import { useStore } from '@/store/StoreProvider';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

export default function AppsTab() {
  const router = useRouter();
  const now = useClock();
  const { state, dispatch, requireChallenge } = useStore();

  return (
    <Screen scroll extraBottom={40}>
      <Type variant="display" style={{ fontSize: 34 }}>
        Apps
      </Type>
      <Type style={styles.lede}>
        Connect what you want locked. Each app keeps its own windows, daily cap, and sitting cap. Universal hours still sit on top.
      </Type>
      <View style={{ gap: 8 }}>
        {CATALOG.map((meta) => {
          const app = state.apps.find((item) => item.id === meta.id)!;
          const status = statusForApp(state, app, now);
          return (
            <Pressable
              key={meta.id}
              style={[styles.row, app.connected && styles.rowOn]}
              onPress={() => {
                if (app.connected) {
                  router.push(`/control/${meta.id}`);
                  return;
                }
                dispatch({ type: 'SET_CONNECTED', id: meta.id, connected: true });
              }}
              onLongPress={() => {
                if (!app.connected) return;
                if (requireChallenge(meta.id)) {
                  router.push({ pathname: '/challenge', params: { next: `/control/${meta.id}`, target: meta.id } });
                  return;
                }
                router.push(`/control/${meta.id}`);
              }}>
              <AppBadge id={meta.id} />
              <View style={{ flex: 1 }}>
                <Type variant="bodyStrong">{meta.name}</Type>
                <Type variant="caption">
                  {app.connected
                    ? `${status.locked ? 'Locked out' : 'Connected'} · ${
                        app.dailyLimitMinutes == null
                          ? 'no cap'
                          : formatDuration(app.dailyLimitMinutes) + ' cap'
                      } · ${app.windows.length} windows`
                    : meta.tagline}
                </Type>
              </View>
              <View style={[styles.mark, app.connected && styles.markOn]}>
                {app.connected ? <Check size={14} color={colors.bg} strokeWidth={2.4} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Type variant="caption" style={{ marginTop: space.md }}>
        Tap an unused app to connect it. Tap a connected one to set hours and caps.
      </Type>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lede: { marginTop: 8, marginBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowOn: {
    borderColor: 'rgba(201, 163, 106, 0.4)',
    backgroundColor: colors.cardHot,
  },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOn: { backgroundColor: colors.brass, borderColor: colors.brass },
});

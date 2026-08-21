import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Type } from '@/components/Type';
import { WindowRow } from '@/components/WindowRow';
import { catalogById } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { inWindow, minutesOfDay } from '@/lib/time';
import { useClock } from '@/lib/useClock';
import { useStore } from '@/store/StoreProvider';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

export default function HoursTab() {
  const router = useRouter();
  const now = useClock();
  const { state, dispatch, requireChallenge } = useStore();

  function guarded(target: string, next: string) {
    if (requireChallenge(target === 'universal' ? 'universal' : target)) {
      router.push({ pathname: '/challenge', params: { next, target } });
      return;
    }
    router.push(next as never);
  }

  return (
    <Screen scroll extraBottom={40}>
      <Type variant="display" style={{ fontSize: 34 }}>
        Hours
      </Type>
      <Type style={styles.lede}>
        Universal windows hit every connected app. Per-app windows stack on top. Overlaps are fine — locked is locked.
      </Type>

      <Card>
        <View style={styles.uniHead}>
          <View style={{ flex: 1 }}>
            <Type variant="bodyStrong">Universal lockout</Type>
            <Type variant="caption">Applies to every connected app, any day you set.</Type>
          </View>
          <Switch
            value={state.universalEnabled}
            onValueChange={(enabled) => {
              if (requireChallenge('universal')) {
                router.push({
                  pathname: '/challenge',
                  params: { next: '/(tabs)/windows', target: 'universal' },
                });
                return;
              }
              dispatch({ type: 'SET_UNIVERSAL', enabled });
            }}
            trackColor={{ false: '#2A2723', true: colors.brassDim }}
            thumbColor={state.universalEnabled ? colors.brass : colors.muted}
          />
        </View>
        {state.universalWindows.map((window) => (
          <WindowRow
            key={window.id}
            label={window.label || 'Universal'}
            start={window.start}
            end={window.end}
            enabled={window.enabled}
            active={state.universalEnabled && inWindow(minutesOfDay(now), window.start, window.end)}
            onPress={() =>
              guarded(
                'universal',
                `/window-editor?target=universal&windowId=${window.id}`,
              )
            }
            onToggle={() => {
              if (requireChallenge('universal')) {
                router.push({ pathname: '/challenge', params: { next: '/(tabs)/windows', target: 'universal' } });
                return;
              }
              dispatch({ type: 'TOGGLE_WINDOW', target: 'universal', windowId: window.id });
            }}
          />
        ))}
        <Button
          label="Add universal window"
          variant="ghost"
          onPress={() => guarded('universal', '/window-editor?target=universal')}
        />
      </Card>

      {state.apps
        .filter((app) => app.connected)
        .map((app) => {
          const name = catalogById(app.id)?.name ?? app.id;
          return (
            <View key={app.id}>
              <SectionHeader title={name} aside={`${app.windows.length}`} />
              <Card padded={false}>
                {app.windows.length === 0 ? (
                  <Type variant="caption" style={{ padding: space.md }}>
                    No hours yet. This app only follows universal lockout and its daily cap.
                  </Type>
                ) : (
                  app.windows.map((window) => (
                    <WindowRow
                      key={window.id}
                      label={window.label || name}
                      start={window.start}
                      end={window.end}
                      enabled={window.enabled}
                      active={inWindow(minutesOfDay(now), window.start, window.end)}
                      onPress={() =>
                        guarded(app.id, `/window-editor?target=${app.id}&windowId=${window.id}`)
                      }
                      onToggle={() => {
                        if (requireChallenge(app.id)) {
                          router.push({
                            pathname: '/challenge',
                            params: { next: '/(tabs)/windows', target: app.id },
                          });
                          return;
                        }
                        dispatch({ type: 'TOGGLE_WINDOW', target: app.id, windowId: window.id });
                      }}
                    />
                  ))
                )}
                <Pressable
                  style={styles.add}
                  onPress={() => guarded(app.id, `/window-editor?target=${app.id}`)}>
                  <Type variant="caption" color={colors.brass}>
                    Add window for {name}
                  </Type>
                </Pressable>
              </Card>
            </View>
          );
        })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lede: { marginTop: 8, marginBottom: space.lg },
  uniHead: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  add: {
    padding: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderRadius: radius.lg,
  },
});

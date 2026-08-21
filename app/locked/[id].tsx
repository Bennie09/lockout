import { Button } from '@/components/Button';
import { LockMark } from '@/components/LockMark';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { catalogById } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { lockScreenHasCustom, lockScreenLine } from '@/lib/lockCopy';
import { reasonCopy, statusForApp } from '@/lib/lockout';
import { useClock } from '@/lib/useClock';
import { useStore } from '@/store/StoreProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export default function Locked() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const now = useClock();
  const { state, dispatch } = useStore();
  const app = state.apps.find((item) => item.id === id);
  const meta = catalogById(id ?? '');
  const status = app ? statusForApp(state, app, now) : null;
  const line = lockScreenLine(state, app, meta?.name);
  const custom = lockScreenHasCustom(state, app);

  useEffect(() => {
    dispatch({
      type: 'LOG',
      title: `Locked out of ${meta?.name ?? 'app'}`,
      detail: line,
      tone: 'lock',
    });
    dispatch({ type: 'ADD_SAVED', minutes: 3 });
  }, [dispatch, meta?.name, line]);

  return (
    <Screen extraBottom={32}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <LockMark size={48} color={colors.terracotta} />
        </View>
        <Type variant="caption" color={colors.terracotta}>
          LOCKED OUT{meta?.name ? ` · ${meta.name.toUpperCase()}` : ''}
        </Type>
        <Type variant={custom ? 'displayItalic' : 'display'} style={styles.title}>
          {line}
        </Type>
        {custom ? (
          <Type style={{ textAlign: 'center' }}>{meta?.name ?? 'This app'} stays closed. That line is yours.</Type>
        ) : (
          <Type style={{ textAlign: 'center' }}>
            You are inside a lockout. Opening it from here — or from the home screen — should feel like hitting a wall.
          </Type>
        )}
        <View style={styles.reasons}>
          {(status?.reasons ?? []).map((reason, i) => (
            <Type key={i} variant="caption" style={styles.reason}>
              {reasonCopy(reason)}
            </Type>
          ))}
        </View>
      </View>
      <Button
        label="Change the hours anyway"
        variant="danger"
        onPress={() =>
          router.push({
            pathname: '/challenge',
            params: { next: `/control/${id}`, target: id ?? 'universal' },
          })
        }
      />
      <Button label="Leave it locked" variant="ghost" style={{ marginTop: 10 }} onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  mark: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(211, 107, 79, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  title: { fontSize: 34, textAlign: 'center', marginVertical: 12 },
  reasons: { marginTop: space.md, gap: 6, alignItems: 'center' },
  reason: { textAlign: 'center' },
});

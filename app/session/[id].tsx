import { AppBadge } from '@/components/AppBadge';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { catalogById } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { statusForApp } from '@/lib/lockout';
import { formatDuration } from '@/lib/time';
import { useStore } from '@/store/StoreProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const FEED = [
  'A reel you did not need.',
  'Someone you barely know, on a boat.',
  'A recipe you will not cook.',
  'Hot take, no source.',
  'The same ad as yesterday.',
  'A stitch of a stitch of a stitch.',
  'News, but worse.',
  'A dog. Okay, the dog is fine.',
];

export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useStore();
  const app = state.apps.find((item) => item.id === id);
  const meta = catalogById(id ?? '');
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useRef(state);
  const addedRef = useRef(0);
  stateRef.current = state;

  useEffect(() => {
    if (!id) return;
    const timer = setInterval(() => {
      const current = stateRef.current;
      const live = current.apps.find((item) => item.id === id);
      if (!live) return;
      const locked = statusForApp(current, live, new Date()).locked;
      if (locked) {
        router.replace(`/locked/${id}`);
        return;
      }
      setElapsed((s) => s + 1);
      addedRef.current += 1;
      const shouldAddMinute = current.fastUsage || addedRef.current % 60 === 0;
      if (shouldAddMinute) {
        dispatch({ type: 'ADD_USAGE', id, minutes: 1 });
        if (current.fastUsage) addedRef.current = 0;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [dispatch, id, router]);

  if (!app || !meta) {
    return (
      <Screen>
        <Type>Unknown app.</Type>
      </Screen>
    );
  }

  const sessionMinutes = state.fastUsage ? elapsed : Math.floor(elapsed / 60);
  const mm = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0');
  const ss = (elapsed % 60).toString().padStart(2, '0');

  return (
    <Screen extraBottom={24}>
      <View style={styles.top}>
        <AppBadge id={app.id} size={36} />
        <View style={{ flex: 1 }}>
          <Type variant="bodyStrong">{meta.name} session</Type>
          <Type variant="caption">
            Inside Lockout · {formatDuration(app.usedMinutesToday)} today
            {sessionMinutes ? ` · +${formatDuration(sessionMinutes)} this sitting` : ''}
          </Type>
        </View>
        <Type variant="title">
          {mm}:{ss}
        </Type>
      </View>
      <View style={styles.feed}>
        {FEED.map((line, i) => (
          <View key={line} style={[styles.card, { opacity: Math.max(0.45, 1 - i * 0.07) }]}>
            <View style={[styles.swatch, { backgroundColor: meta.color }]} />
            <Type variant="bodyStrong">{line}</Type>
            <Type variant="caption">You would still be here. That is the point.</Type>
          </View>
        ))}
      </View>
      <Button label="Leave session" onPress={() => router.replace(`/control/${app.id}`)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: space.md },
  feed: { flex: 1, gap: 10, marginBottom: space.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
  swatch: { width: 36, height: 6, borderRadius: 4, marginBottom: 10 },
});

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { TimeStepper } from '@/components/TimeStepper';
import { Type } from '@/components/Type';
import { catalogById } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { nid } from '@/lib/id';
import { formatTime } from '@/lib/time';
import type { LockoutWindow, Weekday } from '@/store/types';
import { useStore } from '@/store/StoreProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const LABELS = ['Night', 'Deep work', 'Lunch', 'Wind down', 'Custom'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function WindowEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ target?: string; windowId?: string }>();
  const { state, dispatch } = useStore();
  const target = (params.target ?? 'universal') as 'universal' | string;
  const existing = useMemo(() => {
    const list = target === 'universal' ? state.universalWindows : state.apps.find((app) => app.id === target)?.windows ?? [];
    return list.find((window) => window.id === params.windowId);
  }, [params.windowId, state, target]);

  const [start, setStart] = useState(existing?.start ?? '00:00');
  const [end, setEnd] = useState(existing?.end ?? '07:00');
  const [label, setLabel] = useState(existing?.label || 'Night');
  const [days, setDays] = useState<Weekday[]>(existing?.days ?? []);
  const [custom, setCustom] = useState(existing?.label && !LABELS.includes(existing.label) ? existing.label : '');

  const name = target === 'universal' ? 'Universal' : catalogById(target)?.name ?? target;

  function toggleDay(day: Weekday) {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  }

  function save() {
    const window: LockoutWindow = {
      id: existing?.id ?? nid('w_'),
      start,
      end,
      label: label === 'Custom' ? custom.trim() || 'Lockout' : label,
      days,
      enabled: existing?.enabled ?? true,
    };
    dispatch({
      type: existing ? 'UPDATE_WINDOW' : 'ADD_WINDOW',
      target,
      window,
    });
    router.back();
  }

  function remove() {
    if (!existing) return;
    dispatch({ type: 'REMOVE_WINDOW', target, windowId: existing.id });
    router.back();
  }

  return (
    <Screen scroll extraBottom={40}>
      <Pressable onPress={() => router.back()}>
        <Type variant="caption" color={colors.brass}>
          Close
        </Type>
      </Pressable>
      <Type variant="display" style={{ fontSize: 32, marginTop: 8 }}>
        {existing ? 'Edit window' : 'New window'}
      </Type>
      <Type style={{ marginTop: 6, marginBottom: space.lg }}>
        {name} · {formatTime(start)} – {formatTime(end)}
        {days.length === 0 ? ' · every day' : ''}
      </Type>

      <View style={styles.times}>
        <TimeStepper label="From" value={start} onChange={setStart} />
        <TimeStepper label="To" value={end} onChange={setEnd} />
      </View>
      <Type variant="caption" style={{ marginTop: 8, marginBottom: space.md }}>
        Crossing midnight is fine. 12:00 AM to 7:00 AM is a night lockout. 3:00 PM to 4:00 PM is a sharp one.
      </Type>

      <Type variant="section" style={{ marginBottom: 10 }}>
        Label
      </Type>
      <View style={styles.chips}>
        {LABELS.map((item) => (
          <Pressable key={item} onPress={() => setLabel(item)} style={[styles.chip, label === item && styles.chipOn]}>
            <Type variant="label" color={label === item ? colors.bg : colors.cream}>
              {item}
            </Type>
          </Pressable>
        ))}
      </View>
      {label === 'Custom' ? (
        <Field label="Custom label" value={custom} onChangeText={setCustom} placeholder="e.g. After school" autoCapitalize="sentences" />
      ) : null}

      <Type variant="section" style={{ marginBottom: 10, marginTop: 8 }}>
        Days
      </Type>
      <View style={styles.days}>
        {DAY_LETTERS.map((letter, i) => {
          const day = i as Weekday;
          const on = days.length === 0 || days.includes(day);
          const explicit = days.includes(day);
          return (
            <Pressable
              key={`${letter}-${i}`}
              onPress={() => toggleDay(day)}
              style={[styles.day, (days.length === 0 || explicit) && styles.dayOn, days.length === 0 && styles.dayAll]}>
              <Type variant="label" color={on ? colors.bg : colors.cream}>
                {letter}
              </Type>
            </Pressable>
          );
        })}
      </View>
      <Type variant="caption" style={{ marginBottom: space.lg }}>
        Leave them all on for every day. Tap to restrict to specific weekdays.
      </Type>

      <Button label={existing ? 'Save window' : 'Add window'} onPress={save} />
      {existing ? (
        <Button label="Delete window" variant="danger" style={{ marginTop: 10 }} onPress={remove} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  times: { flexDirection: 'row', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.brass, borderColor: colors.brass },
  days: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  day: {
    flex: 1,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayOn: { backgroundColor: colors.brass, borderColor: colors.brass },
  dayAll: { backgroundColor: colors.brassDim, borderColor: colors.brassDim },
});

import { colors, fonts, radius } from '@/constants/theme';
import { formatTime } from '@/lib/time';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

export function WindowRow({
  label,
  start,
  end,
  source,
  enabled,
  active,
  onPress,
  onToggle,
}: {
  label: string;
  start: string;
  end: string;
  source?: string;
  enabled: boolean;
  active?: boolean;
  onPress?: () => void;
  onToggle?: (next: boolean) => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, active && styles.active]}>
      <View style={styles.times}>
        <Text style={styles.range}>
          {formatTime(start)} – {formatTime(end)}
        </Text>
        <Text style={styles.meta}>
          {label}
          {source ? ` · ${source}` : ''}
        </Text>
      </View>
      {onToggle ? (
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#2A2723', true: colors.brassDim }}
          thumbColor={enabled ? colors.brass : colors.muted}
        />
      ) : (
        <View style={[styles.pill, active && styles.pillOn]}>
          <Text style={[styles.pillText, active && styles.pillTextOn]}>{active ? 'Now' : 'Later'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  active: {
    backgroundColor: 'rgba(201, 163, 106, 0.08)',
    borderRadius: radius.md,
    paddingHorizontal: 10,
  },
  times: { flex: 1 },
  range: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.cream,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
  },
  pillOn: { backgroundColor: 'rgba(201, 163, 106, 0.18)' },
  pillText: {
    fontFamily: fonts.sansMed,
    fontSize: 12,
    color: colors.muted,
  },
  pillTextOn: { color: colors.brassBright },
});

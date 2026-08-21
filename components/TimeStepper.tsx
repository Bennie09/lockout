import { colors, fonts, radius, space } from '@/constants/theme';
import { formatTime, parseHHMM, toHHMM } from '@/lib/time';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function TimeStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  function bump(minutes: number) {
    onChange(toHHMM(parseHHMM(value) + minutes));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => bump(-15)} style={styles.btn}>
          <Minus size={16} color={colors.cream} />
        </Pressable>
        <Text style={styles.time}>{formatTime(value)}</Text>
        <Pressable onPress={() => bump(15)} style={styles.btn}>
          <Plus size={16} color={colors.cream} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 6,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    color: colors.cream,
  },
});

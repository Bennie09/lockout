import { colors, fonts, radius, space } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { Delete } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function PinPad({
  value,
  onChange,
  length = 6,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  function press(key: string) {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    onChange(value + key);
  }

  return (
    <View>
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotOn]} />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((key, i) => (
          <Pressable
            key={`${key}-${i}`}
            disabled={!key || disabled}
            onPress={() => press(key)}
            style={({ pressed }) => [
              styles.key,
              !key && styles.empty,
              pressed && key && styles.keyPressed,
            ]}>
            {key === 'del' ? (
              <Delete size={22} color={colors.cream} strokeWidth={1.8} />
            ) : (
              <Text style={styles.keyLabel}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: space.lg,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.brassDim,
    backgroundColor: 'transparent',
  },
  dotOn: {
    backgroundColor: colors.brass,
    borderColor: colors.brass,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 74,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  keyPressed: {
    backgroundColor: colors.cardHot,
    borderColor: colors.brassDim,
  },
  empty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyLabel: {
    fontFamily: fonts.sansMed,
    fontSize: 24,
    color: colors.cream,
  },
});

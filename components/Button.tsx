import { colors, fonts, radius, space } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'quiet';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.bg : colors.cream} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.primaryLabel,
            variant === 'danger' && styles.dangerLabel,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  primary: {
    backgroundColor: colors.brass,
  },
  ghost: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  danger: {
    backgroundColor: colors.terracotta,
  },
  quiet: {
    backgroundColor: 'transparent',
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.cream,
  },
  primaryLabel: {
    color: colors.bg,
  },
  dangerLabel: {
    color: colors.cream,
  },
});

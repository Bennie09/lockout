import { colors, fonts, radius, space } from '@/constants/theme';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Type } from '@/components/Type';

export function Field({
  label,
  hint,
  style,
  ...rest
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.wrap}>
      <Type variant="caption" style={styles.label}>
        {label}
      </Type>
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, style]}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />
      {hint ? (
        <Type variant="caption" style={styles.hint}>
          {hint}
        </Type>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: {
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    color: colors.cream,
    fontFamily: fonts.sansMed,
    fontSize: 16,
  },
  hint: { marginTop: 6 },
});

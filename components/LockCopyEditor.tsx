import { Field } from '@/components/Field';
import { Type } from '@/components/Type';
import { colors, radius } from '@/constants/theme';
import { LOCK_COPY_MAX, LOCK_COPY_PRESETS, normalizeLockCopy } from '@/lib/lockCopy';
import { Pressable, StyleSheet, View } from 'react-native';

export function LockCopyEditor({
  value,
  onChange,
  placeholder,
  hint,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  hint: string;
}) {
  return (
    <View>
      <View style={styles.chips}>
        {LOCK_COPY_PRESETS.map((line) => {
          const on = normalizeLockCopy(value) === line;
          return (
            <Pressable
              key={line}
              onPress={() => onChange(on ? '' : line)}
              style={[styles.chip, on && styles.chipOn]}>
              <Type variant="label" color={on ? colors.bg : colors.cream}>
                {line}
              </Type>
            </Pressable>
          );
        })}
      </View>
      <Field
        label="Your line"
        value={value}
        onChangeText={(next) => onChange(next.slice(0, LOCK_COPY_MAX))}
        placeholder={placeholder}
        autoCapitalize="sentences"
        autoCorrect
        hint={hint}
        maxLength={LOCK_COPY_MAX}
        style={{ minHeight: 72, paddingTop: 14, textAlignVertical: 'top' }}
        multiline
      />
      <Type variant="caption" style={{ marginTop: -8 }}>
        {normalizeLockCopy(value).length}/{LOCK_COPY_MAX}
      </Type>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.brass, borderColor: colors.brass },
});

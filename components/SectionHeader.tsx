import { colors, space } from '@/constants/theme';
import { Type } from '@/components/Type';
import { StyleSheet, View } from 'react-native';

export function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  return (
    <View style={styles.row}>
      <Type variant="section">{title}</Type>
      {aside ? (
        <Type variant="caption" color={colors.brass}>
          {aside}
        </Type>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
    marginTop: space.md,
  },
});

import { catalogById } from '@/constants/catalog';
import { fonts, radius } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export function AppBadge({ id, size = 44 }: { id: string; size?: number }) {
  const app = catalogById(id);
  const letter = (app?.name ?? id).slice(0, 1).toUpperCase();
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: Math.max(radius.sm, size * 0.28),
          backgroundColor: app?.color ?? '#444',
        },
      ]}>
      <Text style={[styles.letter, { fontSize: size * 0.42, color: app?.onColor ?? '#fff' }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: fonts.sansBold,
  },
});

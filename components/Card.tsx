import { colors, radius, space } from '@/constants/theme';
import { StyleSheet, View, type ViewStyle } from 'react-native';

export function Card({
  children,
  style,
  padded = true,
  hot,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  hot?: boolean;
}) {
  return <View style={[styles.card, hot && styles.hot, padded && styles.pad, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hot: {
    backgroundColor: colors.cardHot,
    borderColor: 'rgba(201, 163, 106, 0.28)',
  },
  pad: {
    padding: space.md,
  },
});

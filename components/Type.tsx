import { fonts } from '@/constants/theme';
import { colors } from '@/constants/theme';
import { Text, type TextProps, type TextStyle } from 'react-native';

const styles: Record<string, TextStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: colors.cream,
  },
  displayItalic: {
    fontFamily: fonts.displayItalic,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
    color: colors.cream,
  },
  title: {
    fontFamily: fonts.sansSemi,
    fontSize: 22,
    lineHeight: 28,
    color: colors.cream,
  },
  section: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.creamDim,
  },
  bodyStrong: {
    fontFamily: fonts.sansMed,
    fontSize: 16,
    lineHeight: 22,
    color: colors.cream,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  label: {
    fontFamily: fonts.sansMed,
    fontSize: 14,
    lineHeight: 18,
    color: colors.cream,
  },
};

type Props = TextProps & {
  variant?: keyof typeof styles;
  color?: string;
};

export function Type({ variant = 'body', color, style, ...rest }: Props) {
  return <Text style={[styles[variant], color ? { color } : null, style]} {...rest} />;
}

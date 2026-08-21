import { colors } from '@/constants/theme';
import Svg, { Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Lucide lock icon (ISC), sourced from https://github.com/lucide-icons/lucide/blob/main/icons/lock.svg */
export function LockMark({ size = 32, color = colors.brass, strokeWidth = 1.85 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        width="18"
        height="11"
        x="3"
        y="11"
        rx="2"
        ry="2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

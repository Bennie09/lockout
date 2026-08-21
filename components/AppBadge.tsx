import { BRAND_PATHS, type BrandId } from '@/constants/brandPaths';
import { catalogById } from '@/constants/catalog';
import { fonts, radius } from '@/constants/theme';
import { TikTokMark } from '@/components/TikTokMark';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const TILE: Record<
  string,
  { kind: 'solid' | 'instagram'; bg: string; glyph: string; scale: number; border?: string }
> = {
  instagram: { kind: 'instagram', bg: '#E1306C', glyph: '#FFFFFF', scale: 0.56 },
  youtube: { kind: 'solid', bg: '#FF0000', glyph: '#FFFFFF', scale: 0.62 },
  x: { kind: 'solid', bg: '#0A0A0A', glyph: '#FFFFFF', scale: 0.5, border: 'rgba(255,255,255,0.14)' },
  snapchat: { kind: 'solid', bg: '#FFFC00', glyph: '#0A0A0A', scale: 0.62 },
  facebook: { kind: 'solid', bg: '#1877F2', glyph: '#FFFFFF', scale: 0.9 },
  reddit: { kind: 'solid', bg: '#FF4500', glyph: '#FFFFFF', scale: 0.86 },
  whatsapp: { kind: 'solid', bg: '#25D366', glyph: '#FFFFFF', scale: 0.86 },
  discord: { kind: 'solid', bg: '#5865F2', glyph: '#FFFFFF', scale: 0.62 },
  pinterest: { kind: 'solid', bg: '#E60023', glyph: '#FFFFFF', scale: 0.9 },
};

function Glyph({ d, color, size }: { d: string; color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

export function AppBadge({ id, size = 44 }: { id: string; size?: number }) {
  const app = catalogById(id);
  const tile = TILE[id];
  const path = BRAND_PATHS[id as BrandId];
  const radiusPx = Math.max(radius.sm, size * 0.28);
  const glyphSize = size * (tile?.scale ?? 0.56);

  if (id === 'tiktok') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radiusPx,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
        <TikTokMark size={size * 0.78} />
      </View>
    );
  }

  if (!path || !tile) {
    const letter = (app?.name ?? id).slice(0, 1).toUpperCase();
    return (
      <View
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: radiusPx, backgroundColor: app?.color ?? '#444' },
        ]}>
        <Text style={[styles.letter, { fontSize: size * 0.42, color: app?.onColor ?? '#fff' }]}>{letter}</Text>
      </View>
    );
  }

  const frame = {
    width: size,
    height: size,
    borderRadius: radiusPx,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: tile.border ? StyleSheet.hairlineWidth : 0,
    borderColor: tile.border ?? 'transparent',
  };

  if (tile.kind === 'instagram') {
    return (
      <LinearGradient
        colors={['#F9CE34', '#EE2A7B', '#6228D7']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={frame}>
        <Glyph d={path} color={tile.glyph} size={glyphSize} />
      </LinearGradient>
    );
  }

  return (
    <View style={[frame, { backgroundColor: tile.bg }]}>
      <Glyph d={path} color={tile.glyph} size={glyphSize} />
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

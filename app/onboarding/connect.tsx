import { AppBadge } from '@/components/AppBadge';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { CATALOG } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

export default function Connect() {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>(['instagram', 'tiktok', 'youtube']);
  const [night, setNight] = useState(true);

  function toggle(id: string) {
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <Screen scroll extraBottom={40}>
      <Type variant="caption" color={colors.brass}>
        Step 1 of 3
      </Type>
      <Type variant="display" style={styles.title}>
        Connect the apps you keep opening.
      </Type>
      <Type style={styles.lede}>
        Pick the ones that deserve a lock. You can add more later. Each one gets its own hours and daily cap.
      </Type>
      <View style={styles.list}>
        {CATALOG.map((app) => {
          const on = picked.includes(app.id);
          return (
            <Pressable key={app.id} onPress={() => toggle(app.id)} style={[styles.row, on && styles.rowOn]}>
              <AppBadge id={app.id} />
              <View style={{ flex: 1 }}>
                <Type variant="bodyStrong">{app.name}</Type>
                <Type variant="caption">{app.tagline}</Type>
              </View>
              <View style={[styles.check, on && styles.checkOn]}>
                {on ? <Check size={14} color={colors.bg} strokeWidth={2.4} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.night}>
        <View style={{ flex: 1 }}>
          <Type variant="bodyStrong">Night lockout</Type>
          <Type variant="caption">Universal · 12:00 AM – 7:00 AM, every day. You can split this later.</Type>
        </View>
        <Switch
          value={night}
          onValueChange={setNight}
          trackColor={{ false: '#2A2723', true: colors.brassDim }}
          thumbColor={night ? colors.brass : colors.muted}
        />
      </View>
      <Button
        label={picked.length ? `Continue with ${picked.length}` : 'Pick at least one'}
        disabled={picked.length === 0}
        onPress={() =>
          router.push({
            pathname: '/onboarding/security',
            params: { apps: picked.join(','), night: night ? '1' : '0' },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8, marginBottom: 8 },
  lede: { marginBottom: space.lg },
  list: { gap: 8, marginBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowOn: {
    borderColor: 'rgba(201, 163, 106, 0.55)',
    backgroundColor: colors.cardHot,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.brass,
    borderColor: colors.brass,
  },
  night: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: space.lg,
  },
});

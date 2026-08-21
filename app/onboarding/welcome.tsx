import { Button } from '@/components/Button';
import { LockMark } from '@/components/LockMark';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { colors, radius, space } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Moon, Shield, Timer } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

const POINTS = [
  {
    icon: Moon,
    title: 'Lockout hours',
    body: 'Set as many windows as you want. Night. Lunch. That 3–4pm dip. Each app can have its own.',
  },
  {
    icon: Timer,
    title: 'Daily caps',
    body: 'Give Instagram two hours. When they are gone, it is gone — until tomorrow.',
  },
  {
    icon: Shield,
    title: 'A long lock',
    body: 'Changing the rules mid-lockout means fingerprint, PIN, password, a secret word, and why. On purpose.',
  },
];

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen scroll extraBottom={32}>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <LockMark size={36} />
        </View>
        <Type variant="displayItalic">Lockout</Type>
        <Type style={styles.lede}>
          Keep the apps that steal your hours behind a lock you chose — and a lock that is annoying to pick.
        </Type>
      </View>
      <View style={styles.list}>
        {POINTS.map((point) => (
          <View key={point.title} style={styles.point}>
            <View style={styles.icon}>
              <point.icon size={18} color={colors.brass} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Type variant="bodyStrong">{point.title}</Type>
              <Type variant="caption" style={styles.pointBody}>
                {point.body}
              </Type>
            </View>
          </View>
        ))}
      </View>
      <Button label="Start setup" onPress={() => router.push('/onboarding/connect')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: space.xl, marginBottom: space.xl },
  mark: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(201, 163, 106, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  lede: { marginTop: space.md, maxWidth: 340 },
  list: { gap: 14, marginBottom: space.xl },
  point: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointBody: { marginTop: 4 },
});

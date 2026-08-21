import { AppBadge } from '@/components/AppBadge';
import { Button } from '@/components/Button';
import { LockMark } from '@/components/LockMark';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { catalogById } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { useStore } from '@/store/StoreProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function Ready() {
  const router = useRouter();
  const { dispatch } = useStore();
  const params = useLocalSearchParams<{
    apps?: string;
    night?: string;
    pinHash?: string;
    passwordHash?: string;
    secretWordHash?: string;
    bio?: string;
  }>();
  const apps = (params.apps ?? '').split(',').filter(Boolean);

  function enter() {
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      apps,
      night: params.night === '1',
      security: {
        pinHash: String(params.pinHash ?? ''),
        passwordHash: String(params.passwordHash ?? ''),
        secretWordHash: String(params.secretWordHash ?? ''),
        biometricsEnabled: params.bio === '1',
      },
    });
    router.replace('/(tabs)');
  }

  return (
    <Screen extraBottom={32}>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <LockMark size={40} />
        </View>
        <Type variant="displayItalic">You are locked in.</Type>
        <Type style={styles.lede}>
          The next time a lockout is running, opening an app stops here. Changing the clock takes the long lock — five gates, a few minutes, time to think.
        </Type>
      </View>
      <View style={styles.card}>
        <Type variant="section">Connected</Type>
        <View style={styles.apps}>
          {apps.map((id) => (
            <View key={id} style={styles.app}>
              <AppBadge id={id} size={36} />
              <Type variant="caption">{catalogById(id)?.name}</Type>
            </View>
          ))}
        </View>
        <View style={styles.hr} />
        <Type variant="bodyStrong">{params.night === '1' ? 'Night lockout is on' : 'No night lockout yet'}</Type>
        <Type variant="caption" style={{ marginTop: 4 }}>
          {params.night === '1'
            ? '12:00 AM – 7:00 AM, every connected app. Add lunch, evenings, or per-app hours from Home.'
            : 'Add windows anytime from Hours. Universal and per-app both work.'}
        </Type>
        <View style={styles.hr} />
        <Type variant="bodyStrong">Four gates + a reason</Type>
        <Type variant="caption" style={{ marginTop: 4 }}>
          Fingerprint, 6-digit PIN, password, secret word, then “why do you want this?”
        </Type>
      </View>
      <View style={{ flex: 1 }} />
      <Button label="Enter Lockout" onPress={enter} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: space.lg, marginBottom: space.lg },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(201, 163, 106, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  lede: { marginTop: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  app: { alignItems: 'center', gap: 6, width: 64 },
  hr: { height: 1, backgroundColor: colors.line, marginVertical: 14 },
});

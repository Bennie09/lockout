import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { colors, radius, space } from '@/constants/theme';
import { hashSecret } from '@/lib/crypto';
import { setPendingOnboarding } from '@/lib/pending';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Step = 'pin' | 'pin2' | 'password' | 'password2' | 'word' | 'word2' | 'bio';

export default function Security() {
  const router = useRouter();
  const params = useLocalSearchParams<{ apps?: string; night?: string }>();
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [word, setWord] = useState('');
  const [word2, setWord2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const copy: Record<Step, { kicker: string; title: string; body: string }> = {
    pin: {
      kicker: 'Step 2 of 4 · Gate 1',
      title: 'A six-digit PIN.',
      body: 'Not four. Six. This is the first thing Lockout will ask if you try to cheat a lockout.',
    },
    pin2: {
      kicker: 'Step 2 of 4 · Gate 1',
      title: 'Again, so it sticks.',
      body: 'If you forget this later, you will have to sit through the other gates anyway.',
    },
    password: {
      kicker: 'Step 2 of 4 · Gate 2',
      title: 'A real password.',
      body: 'At least 8 characters. Something you will not type on autopilot.',
    },
    password2: {
      kicker: 'Step 2 of 4 · Gate 2',
      title: 'Confirm the password.',
      body: 'Same one. No paste-and-forget.',
    },
    word: {
      kicker: 'Step 2 of 4 · Gate 3',
      title: 'A secret word.',
      body: 'One word you will remember. A street. A dog. A kitchen tile. Not “password”.',
    },
    word2: {
      kicker: 'Step 2 of 4 · Gate 3',
      title: 'Type the word again.',
      body: 'Lowercase, uppercase — we ignore that. Spelling, we do not.',
    },
    bio: {
      kicker: 'Step 2 of 4 · Gate 4',
      title: 'Fingerprint or face.',
      body: 'If this device supports it, Lockout will ask for it first. On an emulator you can long-press instead.',
    },
  };

  function goNext() {
    setError('');
    if (step === 'pin') {
      if (pin.length !== 6) return setError('PIN must be exactly 6 digits.');
      setStep('pin2');
      return;
    }
    if (step === 'pin2') {
      if (pin !== pin2) return setError('PINs do not match.');
      setStep('password');
      return;
    }
    if (step === 'password') {
      if (password.length < 8) return setError('Use at least 8 characters.');
      setStep('password2');
      return;
    }
    if (step === 'password2') {
      if (password !== password2) return setError('Passwords do not match.');
      setStep('word');
      return;
    }
    if (step === 'word') {
      if (word.trim().length < 4) return setError('Use at least 4 letters.');
      if (/\s/.test(word.trim())) return setError('One word, no spaces.');
      setStep('word2');
      return;
    }
    if (step === 'word2') {
      if (word.trim().toLowerCase() !== word2.trim().toLowerCase()) return setError('Words do not match.');
      setStep('bio');
    }
  }

  async function finish(biometricsEnabled: boolean) {
    setBusy(true);
    try {
      const [pinHash, passwordHash, secretWordHash] = await Promise.all([
        hashSecret(pin),
        hashSecret(password),
        hashSecret(word.trim().toLowerCase()),
      ]);
      await setPendingOnboarding({
        apps: (params.apps ?? '').split(',').filter(Boolean),
        night: params.night === '1',
        security: {
          pinHash,
          passwordHash,
          secretWordHash,
          biometricsEnabled,
        },
      });
      router.push('/onboarding/access');
    } finally {
      setBusy(false);
    }
  }

  async function enableBio() {
    const has = await LocalAuthentication.hasHardwareAsync().catch(() => false);
    const enrolled = has ? await LocalAuthentication.isEnrolledAsync().catch(() => false) : false;
    finish(Boolean(has && enrolled) || true);
  }

  const current = copy[step];

  return (
    <Screen scroll extraBottom={40}>
      <Type variant="caption" color={colors.brass}>
        {current.kicker}
      </Type>
      <Type variant="display" style={styles.title}>
        {current.title}
      </Type>
      <Type style={styles.lede}>{current.body}</Type>

      {step === 'pin' || step === 'pin2' ? (
        <PinPad value={step === 'pin' ? pin : pin2} onChange={step === 'pin' ? setPin : setPin2} />
      ) : null}

      {step === 'password' || step === 'password2' ? (
        <Field
          label="Password"
          secureTextEntry
          value={step === 'password' ? password : password2}
          onChangeText={step === 'password' ? setPassword : setPassword2}
          placeholder="At least 8 characters"
        />
      ) : null}

      {step === 'word' || step === 'word2' ? (
        <Field
          label="Secret word"
          value={step === 'word' ? word : word2}
          onChangeText={step === 'word' ? setWord : setWord2}
          placeholder="oneword"
          autoCapitalize="none"
        />
      ) : null}

      {step === 'bio' ? (
        <View style={styles.bioCard}>
          <Type variant="bodyStrong">Use biometrics when they exist</Type>
          <Type variant="caption" style={{ marginTop: 6 }}>
            Fingerprint and Face ID become gate one of the long lock. You can still get through with PIN if hardware is missing.
          </Type>
        </View>
      ) : null}

      {error ? (
        <Type color={colors.terracotta} style={styles.err}>
          {error}
        </Type>
      ) : null}

      {step === 'bio' ? (
        <View style={{ gap: 10, marginTop: space.md }}>
          <Button label="Turn on biometrics" loading={busy} onPress={enableBio} />
          <Button label="Skip for this device" variant="ghost" disabled={busy} onPress={() => finish(false)} />
        </View>
      ) : (
        <Button
          label="Continue"
          style={{ marginTop: space.lg }}
          onPress={goNext}
          disabled={
            (step === 'pin' && pin.length !== 6) ||
            (step === 'pin2' && pin2.length !== 6)
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8, marginBottom: 8 },
  lede: { marginBottom: space.lg },
  err: { marginTop: 10 },
  bioCard: {
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
});

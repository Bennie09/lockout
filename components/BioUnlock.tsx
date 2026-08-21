import { Button } from '@/components/Button';
import { Type } from '@/components/Type';
import { colors, radius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export function BioUnlock({
  prompt,
  onSuccess,
}: {
  prompt: string;
  onSuccess: () => void;
}) {
  const [holding, setHolding] = useState(false);
  const [hold, setHold] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const success = useRef(onSuccess);
  success.current = onSuccess;

  useEffect(() => {
    if (!holding || done) {
      if (!holding) setHold(0);
      return;
    }
    const t = setInterval(() => setHold((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [holding, done]);

  useEffect(() => {
    if (done || hold < 3) return;
    setDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    success.current();
  }, [hold, done]);

  async function scan() {
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'Not now',
        disableDeviceFallback: true,
      });
      if (result.success) {
        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        success.current();
      } else {
        setError('That did not take. Try again, or long-press below.');
      }
    } catch {
      setError('No biometric hardware. Long-press below for three seconds.');
    }
  }

  return (
    <>
      <Button label="Use fingerprint or face" onPress={scan} />
      <Pressable
        onPressIn={() => setHolding(true)}
        onPressOut={() => setHolding(false)}
        style={[styles.hold, holding && styles.holdOn]}>
        <Type variant="label" color={holding ? colors.bg : colors.cream}>
          {holding ? `Hold… ${hold}s` : 'No sensor? Press and hold 3 seconds'}
        </Type>
      </Pressable>
      {error ? (
        <Type color={colors.terracotta} style={{ marginTop: 4 }}>
          {error}
        </Type>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hold: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  holdOn: { backgroundColor: colors.brass, borderColor: colors.brass },
});

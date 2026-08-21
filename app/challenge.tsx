import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { LockMark } from '@/components/LockMark';
import { PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { SecretEditor } from '@/components/SecretEditor';
import { Type } from '@/components/Type';
import { colors, radius, space } from '@/constants/theme';
import { secretsMatch, wordMatch } from '@/lib/crypto';
import type { SecretKind } from '@/lib/secrets';
import { useStore } from '@/store/StoreProvider';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Kind = 'pause' | 'wait' | 'bio' | 'pin' | 'password' | 'word' | 'why' | 'sit';

type Step = { kind: Kind; seconds?: number; copy?: string };

function useCountdown(active: boolean, seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
  }, [seconds, active]);
  useEffect(() => {
    if (!active) return;
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [active, left]);
  return left;
}

export default function Challenge() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string; target?: string; preview?: string }>();
  const { state, dispatch, unlockGrace } = useStore();

  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [
      {
        kind: 'pause',
        seconds: 50,
        copy: 'You set this lock because the old you did not trust the scrolling you. Give that person fifty seconds.',
      },
    ];
    if (state.security.biometricsEnabled) list.push({ kind: 'bio' });
    list.push(
      { kind: 'wait', seconds: 25, copy: 'Still here. That is information.' },
      { kind: 'pin' },
      { kind: 'wait', seconds: 25, copy: 'A password is next. You can leave.' },
      { kind: 'password' },
      { kind: 'wait', seconds: 25, copy: 'One word you chose on a clearer day.' },
      { kind: 'word' },
      { kind: 'why' },
      { kind: 'sit', seconds: 45, copy: 'Read what you typed. If it is thin, it is not a reason.' },
    );
    return list;
  }, [state.security.biometricsEnabled]);

  const [index, setIndex] = useState(0);
  const step = steps[index];
  const waitLeft = useCountdown(
    step?.kind === 'pause' || step?.kind === 'wait' || step?.kind === 'sit' || step?.kind === 'pin',
    step?.kind === 'pin' ? 12 : step?.seconds ?? 0,
  );

  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [word, setWord] = useState('');
  const [why, setWhy] = useState('');
  const [error, setError] = useState('');
  const [bioOk, setBioOk] = useState(false);
  const [holding, setHolding] = useState(false);
  const [hold, setHold] = useState(0);
  const [fails, setFails] = useState({ pin: 0, password: 0, word: 0 });
  const [recover, setRecover] = useState<SecretKind | null>(null);

  useEffect(() => {
    if (!holding) {
      setHold(0);
      return;
    }
    const t = setInterval(() => setHold((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [holding]);

  useEffect(() => {
    if (hold >= 3 && step?.kind === 'bio') {
      setBioOk(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [hold, step?.kind]);

  useEffect(() => {
    if (pin.length === 6) void checkPin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function abort() {
    dispatch({
      type: 'LOG',
      title: 'Stayed locked',
      detail: 'Walked away from the long lock.',
      tone: 'ok',
    });
    dispatch({ type: 'ADD_SAVED', minutes: 5 });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function advance() {
    setError('');
    setPin('');
    setPassword('');
    setWord('');
    if (index + 1 >= steps.length) {
      finish();
      return;
    }
    setIndex((n) => n + 1);
  }

  function finish() {
    dispatch({
      type: 'LOG',
      title: params.preview === '1' ? 'Rehearsed the long lock' : 'Opened the lock',
      detail: 'Five gates, then a reason.',
      tone: 'warn',
    });
    if (params.preview !== '1') unlockGrace();
    const next = params.next || '/(tabs)';
    router.replace(next as never);
  }

  async function scanBio() {
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock the long lock',
        cancelLabel: 'Not now',
        disableDeviceFallback: true,
      });
      if (result.success) {
        setBioOk(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else setError('That did not take. Try again, or long-press the lock.');
    } catch {
      setError('No biometric hardware. Long-press the lock for three seconds.');
    }
  }

  async function checkPin() {
    const ok = await secretsMatch(pin, state.security.pinHash);
    if (!ok) {
      setFails((current) => ({ ...current, pin: current.pin + 1 }));
      setError('Wrong PIN. Sit with that.');
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setFails((current) => ({ ...current, pin: 0 }));
    advance();
  }

  async function checkPassword() {
    const ok = await secretsMatch(password, state.security.passwordHash);
    if (!ok) {
      setFails((current) => ({ ...current, password: current.password + 1 }));
      setError('Not that password.');
      return;
    }
    setFails((current) => ({ ...current, password: 0 }));
    advance();
  }

  async function checkWord() {
    const ok = await wordMatch(word, state.security.secretWordHash);
    if (!ok) {
      setFails((current) => ({ ...current, word: current.word + 1 }));
      setError('Not that word.');
      return;
    }
    setFails((current) => ({ ...current, word: 0 }));
    advance();
  }

  const gatesDone = steps.slice(0, index).filter((s) => ['bio', 'pin', 'password', 'word', 'why'].includes(s.kind)).length;
  const gatesTotal = steps.filter((s) => ['bio', 'pin', 'password', 'word', 'why'].includes(s.kind)).length;

  if (!step) return null;

  if (recover) {
    return (
      <Screen scroll extraBottom={36}>
        <SecretEditor
          target={recover}
          allowCurrent={false}
          onSaved={() => {
            setRecover(null);
            advance();
          }}
          onCancel={() => setRecover(null)}
        />
      </Screen>
    );
  }

  const gateKind = step.kind === 'pin' || step.kind === 'password' || step.kind === 'word' ? step.kind : null;
  const gateFails = gateKind ? fails[gateKind] : 0;

  const pinReady = step.kind !== 'pin' || waitLeft <= 0;
  const sitReady = step.kind !== 'sit' || waitLeft <= 0;
  const pauseReady = step.kind !== 'pause' || waitLeft <= 0;

  return (
    <Screen scroll extraBottom={36}>
      <View style={styles.top}>
        <Type variant="caption" color={colors.brass}>
          LONG LOCK · {gatesDone}/{gatesTotal} gates
        </Type>
        <Pressable onPress={abort}>
          <Type variant="caption" color={colors.muted}>
            Never mind
          </Type>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.mark}>
          <LockMark size={34} />
        </View>
        <Type variant="display" style={{ fontSize: 32 }}>
          {headline(step)}
        </Type>
        <Type style={{ marginTop: 8 }}>{step.copy ?? body(step)}</Type>
      </View>

      {step.kind === 'pause' || step.kind === 'wait' || step.kind === 'sit' ? (
        <View style={styles.timer}>
          <Type variant="display" color={colors.brass}>
            {formatClock(waitLeft)}
          </Type>
          <Type variant="caption">This delay is the product.</Type>
        </View>
      ) : null}

      {step.kind === 'bio' ? (
        <View style={{ gap: 12 }}>
          <Button label="Use fingerprint or face" onPress={scanBio} />
          <Pressable
            onPressIn={() => setHolding(true)}
            onPressOut={() => setHolding(false)}
            style={[styles.hold, holding && styles.holdOn]}>
            <Type variant="label" color={holding ? colors.bg : colors.cream}>
              {bioOk ? 'Recognized' : holding ? `Hold… ${hold}s` : 'No sensor? Press and hold 3 seconds'}
            </Type>
          </Pressable>
          {bioOk ? <Button label="Continue" onPress={advance} /> : null}
        </View>
      ) : null}

      {step.kind === 'pin' ? (
        <>
          {!pinReady ? (
            <Type variant="caption" color={colors.brass} style={{ marginBottom: 12 }}>
              Keypad opens in {waitLeft}s
            </Type>
          ) : null}
          <PinPad value={pin} onChange={setPin} disabled={!pinReady} />
        </>
      ) : null}

      {step.kind === 'password' ? (
        <>
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <Button label="Unlock this gate" onPress={checkPassword} />
        </>
      ) : null}

      {step.kind === 'word' ? (
        <>
          <Field label="Secret word" value={word} onChangeText={setWord} autoCapitalize="none" />
          <Button label="Unlock this gate" onPress={checkWord} />
        </>
      ) : null}

      {step.kind === 'why' ? (
        <>
          <Field
            label="Why do you want to open this?"
            value={why}
            onChangeText={setWhy}
            placeholder="Write until you hear yourself."
            multiline
            style={{ minHeight: 140, textAlignVertical: 'top', paddingTop: 14 }}
            autoCapitalize="sentences"
            autoCorrect
          />
          <Type variant="caption">{why.trim().length}/80 characters</Type>
          <Button
            label="Sit with this"
            disabled={why.trim().length < 80}
            style={{ marginTop: 12 }}
            onPress={advance}
          />
        </>
      ) : null}

      {error ? (
        <Type color={colors.terracotta} style={{ marginTop: 12 }}>
          {error}
        </Type>
      ) : null}

      {gateKind && gateFails >= 3 ? (
        <Pressable onPress={() => setRecover(gateKind)} style={{ marginTop: 16 }}>
          <Type variant="caption" color={colors.brass}>
            Forgotten? Recover with fingerprint or another secret, then set a new{' '}
            {gateKind === 'word' ? 'word' : gateKind}.
          </Type>
        </Pressable>
      ) : null}

      {step.kind === 'pause' ? (
        <Button label={pauseReady ? 'I still want through' : `Wait ${waitLeft}s`} disabled={!pauseReady} style={{ marginTop: 16 }} onPress={advance} />
      ) : null}
      {step.kind === 'wait' ? (
        <Button label={waitLeft <= 0 ? 'Next gate' : `Wait ${waitLeft}s`} disabled={waitLeft > 0} style={{ marginTop: 16 }} onPress={advance} />
      ) : null}
      {step.kind === 'sit' ? (
        <Button
          label={sitReady ? 'Change the lock' : `Wait ${waitLeft}s`}
          disabled={!sitReady}
          style={{ marginTop: 16 }}
          onPress={finish}
        />
      ) : null}
    </Screen>
  );
}

function headline(step: Step) {
  switch (step.kind) {
    case 'pause':
      return 'Do you need this?';
    case 'wait':
      return 'Hold.';
    case 'bio':
      return 'Prove it is you.';
    case 'pin':
      return 'Six digits.';
    case 'password':
      return 'The password.';
    case 'word':
      return 'The word.';
    case 'why':
      return 'Say why.';
    case 'sit':
      return 'Last chance.';
    default:
      return 'Lockout';
  }
}

function body(step: Step) {
  if (step.kind === 'bio') return 'Fingerprint or face, then the rest. Skipping this is not a shortcut.';
  if (step.kind === 'pin') return 'The six-digit PIN you set when you installed Lockout.';
  if (step.kind === 'password') return 'Not the PIN. The password.';
  if (step.kind === 'word') return 'One word. The one you picked.';
  if (step.kind === 'why') return 'If you cannot fill eighty characters, you do not have a reason. You have an urge.';
  return '';
}

function formatClock(total: number) {
  const s = Math.max(0, total);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md },
  hero: { marginBottom: space.lg },
  mark: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(201, 163, 106, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  timer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    alignItems: 'center',
    marginBottom: space.md,
  },
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

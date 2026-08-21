import { BioUnlock } from '@/components/BioUnlock';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { LockMark } from '@/components/LockMark';
import { PinPad } from '@/components/PinPad';
import { Type } from '@/components/Type';
import { colors, radius, space } from '@/constants/theme';
import {
  hashForKind,
  hashKey,
  matchesKind,
  otherSecrets,
  SECRET_COPY,
  validateSecret,
  type SecretKind,
} from '@/lib/secrets';
import { useStore } from '@/store/StoreProvider';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Phase = 'current' | 'pick' | 'verify' | 'set' | 'confirm';
type Method = 'bio' | SecretKind;

const FAIL_LIMIT = 3;

export function SecretEditor({
  target,
  allowCurrent = true,
  onSaved,
  onCancel,
}: {
  target: SecretKind;
  allowCurrent?: boolean;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { state, dispatch } = useStore();
  const copy = SECRET_COPY[target];
  const alts = useMemo(() => otherSecrets(target), [target]);

  const [phase, setPhase] = useState<Phase>(allowCurrent ? 'current' : 'pick');
  const [method, setMethod] = useState<Method | null>(null);
  const [value, setValue] = useState('');
  const [nextValue, setNextValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');
  const [fails, setFails] = useState(0);
  const [busy, setBusy] = useState(false);

  function resetEntry() {
    setValue('');
    setError('');
  }

  useEffect(() => {
    if ((phase === 'current' || (phase === 'verify' && method === 'pin')) && value.length === 6) {
      void checkValue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, phase, method]);

  async function checkValue() {
    if (phase !== 'current' && phase !== 'verify') return;
    if (phase === 'verify' && (method === 'bio' || !method)) return;

    const checkKind = (phase === 'current' ? target : method) as SecretKind;
    const ok = await matchesKind(checkKind, value, state.security);
    if (!ok) {
      const nextFails = fails + 1;
      setFails(nextFails);
      setValue('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (nextFails >= FAIL_LIMIT && phase === 'current') {
        setError('That is not it. Recover with another gate.');
        setPhase('pick');
        setFails(0);
        return;
      }
      setError(
        nextFails >= FAIL_LIMIT
          ? 'Still wrong. Pick a different gate.'
          : `Wrong ${SECRET_COPY[checkKind].noun}. ${FAIL_LIMIT - nextFails} left before you should switch.`,
      );
      return;
    }
    setFails(0);
    resetEntry();
    setPhase('set');
  }

  function pick(next: Method) {
    resetEntry();
    setFails(0);
    setMethod(next);
    setPhase('verify');
  }

  async function goConfirm() {
    const problem = validateSecret(target, nextValue);
    if (problem) return setError(problem);
    const same = await matchesKind(target, nextValue, state.security);
    if (same) return setError(`Pick a different ${copy.noun}. The old one stays if you reuse it.`);
    setError('');
    setConfirmValue('');
    setPhase('confirm');
  }

  async function save() {
    if (target === 'word') {
      if (nextValue.trim().toLowerCase() !== confirmValue.trim().toLowerCase()) {
        return setError('Words do not match.');
      }
    } else if (nextValue !== confirmValue) {
      return setError(`${copy.title}s do not match.`);
    }
    setBusy(true);
    try {
      const hashed = await hashForKind(target, nextValue);
      dispatch({ type: 'SET_SECURITY', security: { [hashKey(target)]: hashed } });
      dispatch({
        type: 'LOG',
        title: `Updated ${copy.noun}`,
        detail: 'Proved it was you, then replaced the secret.',
        tone: 'ok',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  const headline =
    phase === 'current'
      ? `Current ${copy.noun}`
      : phase === 'pick'
        ? `Forgot your ${copy.noun}?`
        : phase === 'verify'
          ? 'Prove it is you'
          : phase === 'set'
            ? `New ${copy.noun}`
            : `Again, so it sticks`;

  const body =
    phase === 'current'
      ? `Type the ${copy.noun} you set. If it is gone, recover with fingerprint, or another secret.`
      : phase === 'pick'
        ? `To change the ${copy.noun}, unlock one of the others. Fingerprint is the easy one if this phone has it.`
        : phase === 'verify' && method === 'bio'
          ? 'Fingerprint or face, then you set a new secret. The old one is done after that.'
          : phase === 'verify'
            ? `Use your ${SECRET_COPY[method as SecretKind].noun} so we know it is you.`
            : phase === 'set'
              ? `You have to change it to something else. The old ${copy.noun} will not work after you save.`
              : `Same ${copy.noun} again. No skipping.`;

  const activeKind: SecretKind | null =
    phase === 'current' ? target : phase === 'verify' && method && method !== 'bio' ? method : null;
  const editingKind: SecretKind | null = phase === 'set' || phase === 'confirm' ? target : null;
  const fieldValue = phase === 'confirm' ? confirmValue : phase === 'set' ? nextValue : value;
  const setField =
    phase === 'confirm' ? setConfirmValue : phase === 'set' ? setNextValue : setValue;

  return (
    <View>
      <View style={styles.top}>
        <Type variant="caption" color={colors.brass}>
          {copy.kicker.toUpperCase()}
        </Type>
        <Pressable onPress={onCancel}>
          <Type variant="caption" color={colors.muted}>
            {phase === 'set' || phase === 'confirm' ? 'Keep the old one' : 'Close'}
          </Type>
        </Pressable>
      </View>

      <View style={styles.mark}>
        <LockMark size={28} />
      </View>
      <Type variant="display" style={{ fontSize: 32 }}>
        {headline}
      </Type>
      <Type style={{ marginTop: 8, marginBottom: space.lg }}>{body}</Type>

      {phase === 'pick' ? (
        <View style={{ gap: 10 }}>
          {state.security.biometricsEnabled ? (
            <Button label="Use fingerprint or face" onPress={() => pick('bio')} />
          ) : null}
          {alts.map((kind) => (
            <Button
              key={kind}
              label={`Use ${SECRET_COPY[kind].noun}`}
              variant="ghost"
              onPress={() => pick(kind)}
            />
          ))}
        </View>
      ) : null}

      {phase === 'verify' && method === 'bio' ? (
        <View style={{ gap: 10 }}>
          <BioUnlock prompt={`Unlock to change your ${copy.noun}`} onSuccess={() => setPhase('set')} />
        </View>
      ) : null}

      {activeKind === 'pin' || editingKind === 'pin' ? (
        <PinPad value={fieldValue} onChange={setField} />
      ) : null}

      {(activeKind === 'password' || editingKind === 'password') && (
        <Field
          label="Password"
          secureTextEntry
          value={fieldValue}
          onChangeText={setField}
          placeholder="At least 8 characters"
        />
      )}

      {(activeKind === 'word' || editingKind === 'word') && (
        <Field
          label="Secret word"
          value={fieldValue}
          onChangeText={setField}
          placeholder="oneword"
          autoCapitalize="none"
        />
      )}

      {phase === 'current' && fails >= 2 ? (
        <Pressable onPress={() => { resetEntry(); setPhase('pick'); }} style={{ marginTop: 8 }}>
          <Type variant="caption" color={colors.brass}>
            Forgotten? Recover with another gate.
          </Type>
        </Pressable>
      ) : null}

      {phase === 'current' && target !== 'pin' ? (
        <Button label="Continue" style={{ marginTop: 8 }} onPress={() => void checkValue()} />
      ) : null}

      {phase === 'verify' && method && method !== 'bio' && method !== 'pin' ? (
        <Button label="Unlock this gate" onPress={() => void checkValue()} />
      ) : null}

      {phase === 'set' ? (
        <Button
          label={`Set new ${copy.noun}`}
          style={{ marginTop: 8 }}
          disabled={target === 'pin' ? nextValue.length !== 6 : nextValue.length === 0}
          onPress={() => void goConfirm()}
        />
      ) : null}

      {phase === 'confirm' ? (
        <Button
          label="Save"
          loading={busy}
          style={{ marginTop: 8 }}
          disabled={target === 'pin' ? confirmValue.length !== 6 : confirmValue.length === 0}
          onPress={() => void save()}
        />
      ) : null}

      {error ? (
        <Type color={colors.terracotta} style={{ marginTop: 12 }}>
          {error}
        </Type>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md },
  mark: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(201, 163, 106, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
});

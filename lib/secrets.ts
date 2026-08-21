import { hashSecret, secretsMatch, wordMatch } from '@/lib/crypto';
import type { Security } from '@/store/types';

export type SecretKind = 'pin' | 'password' | 'word';

export const SECRET_COPY: Record<
  SecretKind,
  { title: string; noun: string; kicker: string }
> = {
  pin: { title: 'PIN', noun: 'PIN', kicker: 'Six digits' },
  password: { title: 'Password', noun: 'password', kicker: 'The long one' },
  word: { title: 'Secret word', noun: 'secret word', kicker: 'One word' },
};

export function otherSecrets(target: SecretKind): SecretKind[] {
  return (['pin', 'password', 'word'] as SecretKind[]).filter((kind) => kind !== target);
}

export function validateSecret(kind: SecretKind, value: string) {
  if (kind === 'pin') {
    if (!/^\d{6}$/.test(value)) return 'PIN must be exactly 6 digits.';
    return null;
  }
  if (kind === 'password') {
    if (value.length < 8) return 'Use at least 8 characters.';
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length < 4) return 'Use at least 4 letters.';
  if (/\s/.test(trimmed)) return 'One word, no spaces.';
  return null;
}

export async function hashForKind(kind: SecretKind, value: string) {
  if (kind === 'word') return hashSecret(value.trim().toLowerCase());
  return hashSecret(value);
}

export async function matchesKind(kind: SecretKind, value: string, security: Security) {
  if (kind === 'pin') return secretsMatch(value, security.pinHash);
  if (kind === 'password') return secretsMatch(value, security.passwordHash);
  return wordMatch(value, security.secretWordHash);
}

export function hashKey(kind: SecretKind): keyof Pick<Security, 'pinHash' | 'passwordHash' | 'secretWordHash'> {
  if (kind === 'pin') return 'pinHash';
  if (kind === 'password') return 'passwordHash';
  return 'secretWordHash';
}

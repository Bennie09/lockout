import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Security } from '@/store/types';

export type PendingOnboarding = {
  apps: string[];
  night: boolean;
  security: Security;
};

const PENDING_KEY = 'lockout.pending.v1';

let memory: PendingOnboarding | null | undefined;

export async function setPendingOnboarding(next: PendingOnboarding) {
  memory = next;
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(next));
}

export async function peekPendingOnboarding() {
  if (memory !== undefined) return memory;
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    memory = raw ? (JSON.parse(raw) as PendingOnboarding) : null;
  } catch {
    memory = null;
  }
  return memory;
}

export async function takePendingOnboarding() {
  const value = await peekPendingOnboarding();
  memory = null;
  await AsyncStorage.removeItem(PENDING_KEY);
  return value;
}

export async function clearPendingOnboarding() {
  memory = null;
  await AsyncStorage.removeItem(PENDING_KEY);
}

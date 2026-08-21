import type { Security } from '@/store/types';

export type PendingOnboarding = {
  apps: string[];
  night: boolean;
  security: Security;
};

let pending: PendingOnboarding | null = null;

export function setPendingOnboarding(next: PendingOnboarding) {
  pending = next;
}

export function takePendingOnboarding() {
  const value = pending;
  pending = null;
  return value;
}

export function peekPendingOnboarding() {
  return pending;
}

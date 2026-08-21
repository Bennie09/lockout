export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type LockoutWindow = {
  id: string;
  start: string;
  end: string;
  label: string;
  days: Weekday[];
  enabled: boolean;
};

export type ConnectedApp = {
  id: string;
  connected: boolean;
  dailyLimitMinutes: number | null;
  scrollCapMinutes: number | null;
  cooldownMinutes: number | null;
  cooldownUntil: number;
  usedMinutesToday: number;
  usedSecondsToday: number;
  sittingSeconds: number;
  windows: LockoutWindow[];
  lockMessage: string;
};

export type Security = {
  pinHash: string;
  passwordHash: string;
  secretWordHash: string;
  biometricsEnabled: boolean;
};

export type Activity = {
  id: string;
  at: number;
  title: string;
  detail: string;
  tone: 'lock' | 'ok' | 'warn';
};

export type AppState = {
  onboarded: boolean;
  fastUsage: boolean;
  apps: ConnectedApp[];
  universalEnabled: boolean;
  universalWindows: LockoutWindow[];
  security: Security;
  activity: Activity[];
  streakDays: number;
  minutesSaved: number;
  lastResetDate: string;
  lastActiveDate: string;
  lockMessage: string;
};

export type LockReason =
  | { kind: 'universal'; window: LockoutWindow }
  | { kind: 'window'; window: LockoutWindow }
  | { kind: 'limit'; used: number; cap: number }
  | { kind: 'scroll'; sitting: number; cap: number }
  | { kind: 'cooldown'; until: number };

export type AppLockStatus = {
  id: string;
  locked: boolean;
  reasons: LockReason[];
  nextEvent: { kind: 'starts' | 'ends'; atMinutes: number; label: string } | null;
};

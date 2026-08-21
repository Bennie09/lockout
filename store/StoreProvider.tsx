import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { nid } from '@/lib/id';
import { grantEditGrace, hasEditGrace, isProtectedEdit } from '@/lib/lockout';
import { todayKey } from '@/lib/time';
import { createInitialState, normalizeApp, pushActivity, rollDay } from '@/store/defaults';
import type { AppState, ConnectedApp, LockoutWindow, Security } from '@/store/types';

const STORAGE_KEY = 'lockout.state.v1';

type Action =
  | { type: 'HYDRATE'; payload: AppState }
  | { type: 'COMPLETE_ONBOARDING'; apps: string[]; security: Security; night: boolean }
  | { type: 'SET_CONNECTED'; id: string; connected: boolean }
  | { type: 'SET_LIMIT'; id: string; minutes: number | null }
  | { type: 'SET_SCROLL_CAP'; id: string; minutes: number | null }
  | { type: 'SET_COOLDOWN'; id: string; minutes: number | null }
  | { type: 'SYNC_USAGE'; apps: Record<string, { usedSeconds: number; sittingSeconds: number; cooldownUntil: number }> }
  | { type: 'ADD_USAGE'; id: string; minutes: number }
  | { type: 'ADD_WINDOW'; target: 'universal' | string; window: LockoutWindow }
  | { type: 'UPDATE_WINDOW'; target: 'universal' | string; window: LockoutWindow }
  | { type: 'REMOVE_WINDOW'; target: 'universal' | string; windowId: string }
  | { type: 'TOGGLE_WINDOW'; target: 'universal' | string; windowId: string }
  | { type: 'SET_UNIVERSAL'; enabled: boolean }
  | { type: 'SET_FAST'; enabled: boolean }
  | { type: 'SET_SECURITY'; security: Partial<Security> }
  | { type: 'LOG'; title: string; detail: string; tone: 'lock' | 'ok' | 'warn' }
  | { type: 'ADD_SAVED'; minutes: number }
  | { type: 'RESET' };

function withApp(state: AppState, id: string, map: (app: ConnectedApp) => ConnectedApp): AppState {
  return {
    ...state,
    apps: state.apps.map((app) => (app.id === id ? map(app) : app)),
  };
}

function withWindows(
  state: AppState,
  target: 'universal' | string,
  map: (windows: LockoutWindow[]) => LockoutWindow[],
): AppState {
  if (target === 'universal') {
    return { ...state, universalWindows: map(state.universalWindows) };
  }
  return withApp(state, target, (app) => ({ ...app, windows: map(app.windows) }));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': {
      const incoming = action.payload;
      return rollDay({
        ...createInitialState(),
        ...incoming,
        apps: (incoming.apps ?? []).map((app) => normalizeApp(app)),
      });
    }
    case 'COMPLETE_ONBOARDING': {
      let next: AppState = {
        ...state,
        onboarded: true,
        security: action.security,
        lastActiveDate: todayKey(),
        lastResetDate: todayKey(),
        streakDays: 1,
        apps: state.apps.map((app) => ({
          ...app,
          connected: action.apps.includes(app.id),
          usedSecondsToday: 0,
          usedMinutesToday: 0,
          sittingSeconds: 0,
          cooldownUntil: 0,
        })),
      };
      if (action.night) {
        next = {
          ...next,
          universalEnabled: true,
          universalWindows: [
            {
              id: nid('w_'),
              start: '00:00',
              end: '07:00',
              label: 'Night',
              days: [],
              enabled: true,
            },
          ],
        };
      }
      return pushActivity(next, {
        title: 'Lockout is live',
        detail: `${action.apps.length} apps connected${action.night ? ' · night lockout on' : ''}`,
        tone: 'ok',
      });
    }
    case 'SET_CONNECTED':
      return pushActivity(
        withApp(state, action.id, (app) => ({ ...app, connected: action.connected })),
        {
          title: action.connected ? 'App connected' : 'App released',
          detail: action.id,
          tone: action.connected ? 'ok' : 'warn',
        },
      );
    case 'SET_LIMIT':
      return withApp(state, action.id, (app) => ({ ...app, dailyLimitMinutes: action.minutes }));
    case 'SET_SCROLL_CAP':
      return withApp(state, action.id, (app) => ({ ...app, scrollCapMinutes: action.minutes }));
    case 'SET_COOLDOWN':
      return withApp(state, action.id, (app) => ({ ...app, cooldownMinutes: action.minutes }));
    case 'SYNC_USAGE':
      return {
        ...state,
        apps: state.apps.map((app) => {
          const snap = action.apps[app.id];
          if (!snap) {
            return { ...app, sittingSeconds: 0 };
          }
          return {
            ...app,
            usedSecondsToday: snap.usedSeconds,
            usedMinutesToday: Math.floor(snap.usedSeconds / 60),
            sittingSeconds: snap.sittingSeconds,
            cooldownUntil: snap.cooldownUntil,
          };
        }),
      };
    case 'ADD_USAGE':
      return withApp(state, action.id, (app) => ({
        ...app,
        usedMinutesToday: app.usedMinutesToday + action.minutes,
        usedSecondsToday: app.usedSecondsToday + action.minutes * 60,
      }));
    case 'ADD_WINDOW':
      return withWindows(state, action.target, (windows) => [...windows, action.window]);
    case 'UPDATE_WINDOW':
      return withWindows(state, action.target, (windows) =>
        windows.map((window) => (window.id === action.window.id ? action.window : window)),
      );
    case 'REMOVE_WINDOW':
      return withWindows(state, action.target, (windows) => windows.filter((window) => window.id !== action.windowId));
    case 'TOGGLE_WINDOW':
      return withWindows(state, action.target, (windows) =>
        windows.map((window) =>
          window.id === action.windowId ? { ...window, enabled: !window.enabled } : window,
        ),
      );
    case 'SET_UNIVERSAL':
      return { ...state, universalEnabled: action.enabled };
    case 'SET_FAST':
      return { ...state, fastUsage: action.enabled };
    case 'SET_SECURITY':
      return { ...state, security: { ...state.security, ...action.security } };
    case 'LOG':
      return pushActivity(state, { title: action.title, detail: action.detail, tone: action.tone });
    case 'ADD_SAVED':
      return { ...state, minutesSaved: state.minutesSaved + action.minutes };
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

type StoreValue = {
  ready: boolean;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  requireChallenge: (appId: string | 'universal') => boolean;
  unlockGrace: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as AppState;
          dispatch({ type: 'HYDRATE', payload: { ...createInitialState(), ...parsed } });
        }
      } catch {
        // Keep defaults if storage is empty or corrupt.
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const unlockGrace = useCallback(() => {
    grantEditGrace();
  }, []);

  const requireChallenge = useCallback(
    (appId: string | 'universal') => {
      if (hasEditGrace()) return false;
      return isProtectedEdit(state, appId);
    },
    [state],
  );

  const value = useMemo(
    () => ({ ready, state, dispatch, requireChallenge, unlockGrace }),
    [ready, state, requireChallenge, unlockGrace],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const SALT_KEY = 'lockout.salt.v1';
const V2 = 'v2';

let saltLock: Promise<string> | null = null;

async function read(key: string) {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value) return value;
  } catch {
    // Expo Go web / unsupported SecureStore
  }
  return AsyncStorage.getItem(key);
}

async function write(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
    return;
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function remove(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(key);
}

/** Legacy global salt. Only used to check secrets hashed before v2. */
export async function getSalt() {
  if (!saltLock) {
    saltLock = (async () => {
      let salt = await read(SALT_KEY);
      if (!salt) {
        salt = Crypto.randomUUID();
        await write(SALT_KEY, salt);
      }
      return salt;
    })().catch((error) => {
      saltLock = null;
      throw error;
    });
  }
  return saltLock;
}

export async function clearLegacySalt() {
  saltLock = null;
  await remove(SALT_KEY);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function sha256(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function parseV2(stored: string) {
  if (!stored.startsWith(`${V2}:`)) return null;
  const rest = stored.slice(V2.length + 1);
  const split = rest.lastIndexOf(':');
  if (split <= 0) return null;
  const salt = rest.slice(0, split);
  const digest = rest.slice(split + 1);
  if (!salt || !digest) return null;
  return { salt, digest };
}

export async function hashSecret(value: string) {
  const salt = Crypto.randomUUID();
  const digest = await sha256(`${salt}:${value.trim()}`);
  return `${V2}:${salt}:${digest}`;
}

async function matchLegacy(value: string, stored: string) {
  const salt = await getSalt();
  const digest = await sha256(`${salt}:${value.trim()}`);
  return safeEqual(digest, stored);
}

export async function secretsMatch(value: string, stored: string) {
  if (!stored) return false;
  const parsed = parseV2(stored);
  if (parsed) {
    const digest = await sha256(`${parsed.salt}:${value.trim()}`);
    return safeEqual(digest, parsed.digest);
  }
  return matchLegacy(value, stored);
}

export async function wordMatch(value: string, hash: string) {
  return secretsMatch(value.trim().toLowerCase(), hash);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const SALT_KEY = 'lockout.salt.v1';

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

export async function getSalt() {
  let salt = await read(SALT_KEY);
  if (!salt) {
    salt = Crypto.randomUUID();
    await write(SALT_KEY, salt);
  }
  return salt;
}

export async function hashSecret(value: string) {
  const salt = await getSalt();
  const normalized = value.trim();
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${normalized}`,
  );
}

export async function secretsMatch(value: string, hash: string) {
  const next = await hashSecret(value);
  return next === hash;
}

export async function wordMatch(value: string, hash: string) {
  return secretsMatch(value.trim().toLowerCase(), hash);
}

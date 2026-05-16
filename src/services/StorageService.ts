import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDING_COMPLETE: '@onesong:onboarding_complete',
  SELECTED_SONG: '@onesong:selected_song',
  SLEEP_TIMER: '@onesong:sleep_timer',
  AUTOPLAY_ENABLED: '@onesong:autoplay_enabled',
} as const;

export async function getItem(key: keyof typeof KEYS): Promise<string | null> {
  return AsyncStorage.getItem(KEYS[key]);
}

export async function setItem(key: keyof typeof KEYS, value: string): Promise<void> {
  await AsyncStorage.setItem(KEYS[key], value);
}

export async function removeItem(key: keyof typeof KEYS): Promise<void> {
  await AsyncStorage.removeItem(KEYS[key]);
}

export async function multiRemove(keys: (keyof typeof KEYS)[]): Promise<void> {
  await AsyncStorage.multiRemove(keys.map(k => KEYS[k]));
}

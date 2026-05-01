import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

export async function saveSong(song: Song): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SONG, JSON.stringify(song));
}

export async function getSong(): Promise<Song | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SONG);
  return data ? JSON.parse(data) : null;
}

export async function saveSleepTimer(minutes: number | null): Promise<void> {
  if (minutes === null) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SLEEP_TIMER);
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_TIMER, String(minutes));
  }
}

export async function getSleepTimer(): Promise<number | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_TIMER);
  return data ? Number(data) : null;
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  return value === 'true';
}

export async function saveAutoPlayEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AUTOPLAY_ENABLED, String(enabled));
}

export async function getAutoPlayEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTOPLAY_ENABLED);
  return value !== 'false';
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ONBOARDING_COMPLETE,
    STORAGE_KEYS.SELECTED_SONG,
    STORAGE_KEYS.SLEEP_TIMER,
    STORAGE_KEYS.AUTOPLAY_ENABLED,
  ]);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer from 'react-native-track-player';
import { STORAGE_KEYS } from '@/utils/constants';

let activeTimerId: ReturnType<typeof setTimeout> | null = null;

export async function setTimer(minutes: number | null): Promise<void> {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
  if (minutes && minutes > 0) {
    activeTimerId = setTimeout(() => {
      TrackPlayer.pause();
    }, minutes * 60 * 1000);
  }
}

export async function clearTimer(): Promise<void> {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
}

export async function getDefaultTimer(): Promise<number | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_TIMER);
  return data ? Number(data) : null;
}

export async function setDefaultTimer(minutes: number | null): Promise<void> {
  if (minutes === null) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SLEEP_TIMER);
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_TIMER, String(minutes));
  }
}

export async function restoreTimer(): Promise<void> {
  const minutes = await getDefaultTimer();
  if (minutes) {
    await setTimer(minutes);
  }
}

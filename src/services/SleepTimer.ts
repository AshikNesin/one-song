import TrackPlayer from 'react-native-track-player';
import { getSleepTimer, saveSleepTimer } from './StorageService';

let activeTimerId: ReturnType<typeof setTimeout> | null = null;

export async function getDefaultSleepTimer(): Promise<number | null> {
  return getSleepTimer();
}

export async function setDefaultSleepTimer(minutes: number | null): Promise<void> {
  await saveSleepTimer(minutes);
}

export function setSleepTimer(minutes: number | null): void {
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

export function clearSleepTimer(): void {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
}

export function getRemainingMinutes(): number | null {
  // Not currently tracked; could be extended if needed
  return null;
}

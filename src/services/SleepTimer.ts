import * as Storage from '@/services/StorageService';

let activeTimerId: ReturnType<typeof setTimeout> | null = null;

export async function setTimer(minutes: number | null, onExpire?: () => void): Promise<void> {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
  if (minutes && minutes > 0) {
    activeTimerId = setTimeout(() => {
      onExpire?.();
    }, minutes * 60 * 1000);
  }
}

export async function clearTimer(): Promise<void> {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
}

export async function loadDefaultTimer(): Promise<number | null> {
  const data = await Storage.getItem('SLEEP_TIMER');
  return data ? Number(data) : null;
}

export async function saveDefaultTimer(minutes: number | null): Promise<void> {
  if (minutes === null) {
    await Storage.removeItem('SLEEP_TIMER');
  } else {
    await Storage.setItem('SLEEP_TIMER', String(minutes));
  }
}

export async function restoreTimer(onExpire?: () => void): Promise<void> {
  const minutes = await loadDefaultTimer();
  if (minutes) {
    await setTimer(minutes, onExpire);
  }
}

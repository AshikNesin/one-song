import * as Storage from '@/services/StorageService';
import { pause } from '@/services/AudioService';

let activeTimerId: ReturnType<typeof setTimeout> | null = null;
let expiresAt: number | null = null;

async function expire(): Promise<void> {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
  expiresAt = null;
  await Storage.removeItem('SLEEP_TIMER_EXPIRES_AT');
  await pause();
}

export async function checkExpiry(): Promise<void> {
  if (expiresAt === null) {
    const persisted = await Storage.getItem('SLEEP_TIMER_EXPIRES_AT');
    if (!persisted) {
      return;
    }
    expiresAt = Number(persisted);
  }
  if (Date.now() >= expiresAt) {
    await expire();
  }
}

export async function setTimer(minutes: number | null): Promise<void> {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
  expiresAt = null;
  await Storage.removeItem('SLEEP_TIMER_EXPIRES_AT');

  if (minutes && minutes > 0) {
    expiresAt = Date.now() + minutes * 60 * 1000;
    await Storage.setItem('SLEEP_TIMER_EXPIRES_AT', String(expiresAt));
    activeTimerId = setTimeout(() => {
      expire();
    }, minutes * 60 * 1000);
  }
}

export async function clearTimer(): Promise<void> {
  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }
  expiresAt = null;
  await Storage.removeItem('SLEEP_TIMER_EXPIRES_AT');
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

export async function restoreTimer(): Promise<void> {
  const minutes = await loadDefaultTimer();
  if (minutes) {
    await setTimer(minutes);
  }
}

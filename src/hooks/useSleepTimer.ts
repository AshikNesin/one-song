import { useState, useEffect, useCallback } from 'react';
import {
  loadDefaultTimer,
  saveDefaultTimer,
  setTimer,
  clearTimer,
} from '@/services/SleepTimer';

export interface UseSleepTimerResult {
  currentMinutes: number | null;
  selectPreset: (minutes: number | null, onExpire?: () => void) => Promise<void>;
  clear: () => Promise<void>;
}

let sharedMinutes: number | null = null;
let isLoaded = false;
const listeners = new Set<(val: number | null) => void>();

function notifyListeners(val: number | null) {
  sharedMinutes = val;
  listeners.forEach(l => l(val));
}

export function useSleepTimer(): UseSleepTimerResult {
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(sharedMinutes);

  useEffect(() => {
    const listener = (val: number | null) => setCurrentMinutes(val);
    listeners.add(listener);

    if (!isLoaded) {
      loadDefaultTimer()
        .then(val => {
          isLoaded = true;
          notifyListeners(val);
        })
        .catch(() => {});
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const selectPreset = useCallback(async (minutes: number | null, onExpire?: () => void) => {
    notifyListeners(minutes);
    await saveDefaultTimer(minutes);
    await clearTimer();
    if (minutes && minutes > 0 && onExpire) {
      await setTimer(minutes, onExpire);
    }
  }, []);

  const clear = useCallback(async () => {
    notifyListeners(null);
    await saveDefaultTimer(null);
    await clearTimer();
  }, []);

  return { currentMinutes, selectPreset, clear };
}

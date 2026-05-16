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

export function useSleepTimer(): UseSleepTimerResult {
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    loadDefaultTimer().then(setCurrentMinutes);
  }, []);

  const selectPreset = useCallback(async (minutes: number | null, onExpire?: () => void) => {
    setCurrentMinutes(minutes);
    await saveDefaultTimer(minutes);
    await clearTimer();
    if (minutes && minutes > 0) {
      await setTimer(minutes, onExpire);
    }
  }, []);

  const clear = useCallback(async () => {
    await clearTimer();
  }, []);

  return { currentMinutes, selectPreset, clear };
}

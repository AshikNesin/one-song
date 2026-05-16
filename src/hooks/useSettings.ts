import { useState, useEffect, useCallback } from 'react';
import { getSong, clearSongData } from '@/services/SongIntake';
import { getAutoPlayEnabled, saveAutoPlayEnabled } from '@/services/Playback';
import { useSleepTimer } from './useSleepTimer';

export interface SettingsState {
  defaultTimerMinutes: number | null;
  currentSong: string | null;
  autoPlay: boolean;
}

export interface SettingsActions {
  setTimerPreset: (minutes: number | null) => Promise<void>;
  toggleAutoPlay: (enabled: boolean) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export function useSettings(): { state: SettingsState; actions: SettingsActions } {
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const sleepTimer = useSleepTimer();

  useEffect(() => {
    getSong().then(song => setCurrentSong(song?.title ?? null));
    getAutoPlayEnabled().then(setAutoPlay);
  }, []);

  const setTimerPreset = useCallback(async (minutes: number | null) => {
    await sleepTimer.selectPreset(minutes);
  }, [sleepTimer]);

  const toggleAutoPlay = useCallback(async (enabled: boolean) => {
    setAutoPlay(enabled);
    await saveAutoPlayEnabled(enabled);
  }, []);

  const clearAllData = useCallback(async () => {
    await clearSongData();
    await sleepTimer.clear();
  }, [sleepTimer]);

  return {
    state: {
      defaultTimerMinutes: sleepTimer.currentMinutes,
      currentSong,
      autoPlay,
    },
    actions: {
      setTimerPreset,
      toggleAutoPlay,
      clearAllData,
    },
  };
}

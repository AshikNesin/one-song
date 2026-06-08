import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { PlaybackState, getState, subscribe, init, togglePlay, seek, startPolling, stopPolling, handleAudioFocus, handleRemotePlay, handleRemotePause, handleRemoteSeek } from '@/services/Playback';
import { useAudioFocus, useRemotePlayPause, useRemoteSeek } from '@/services/AudioService';
import { checkExpiry } from '@/services/SleepTimer';

export function usePlaybackController() {
  const [state, setState] = useState<PlaybackState>(getState());

  useEffect(() => {
    return subscribe(setState);
  }, []);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkExpiry();
      }
    });
    return () => subscription.remove();
  }, []);

  useAudioFocus(event => {
    handleAudioFocus(event);
  });

  useRemotePlayPause(
    async () => {
      await handleRemotePlay();
    },
    async () => {
      await handleRemotePause();
    },
  );

  useRemoteSeek(async (position: number) => {
    await handleRemoteSeek(position);
  });

  return {
    ...state,
    togglePlay,
    seek,
  };
}

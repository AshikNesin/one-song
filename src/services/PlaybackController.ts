import { useEffect, useState } from 'react';
import { PlaybackState, getState, subscribe, init, togglePlay, seek, startPolling, stopPolling, handleAudioFocus, handleRemotePlay, handleRemotePause, handleRemoteSeek } from '@/services/Playback';
import { useAudioFocus, useRemotePlayPause, useRemoteSeek } from '@/services/AudioService';

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

import { useEffect, useState } from 'react';
import { PlaybackState, getState, subscribe, init, togglePlay, seek, startPolling, stopPolling, handleAudioFocus, handleRemotePlay, handleRemotePause } from './Playback';
import { useAudioFocus, useRemotePlayPause } from './AudioService';

export type { PlaybackState };

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

  return {
    ...state,
    togglePlay,
    seek,
  };
}

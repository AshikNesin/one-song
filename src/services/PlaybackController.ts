import { useCallback, useEffect, useRef, useState } from 'react';
import { State } from 'react-native-track-player';
import { Song } from '../types';
import {
  setupPlayer,
  loadSong,
  play,
  pause,
  getPlaybackState,
  getProgress,
  seekTo,
  useAudioFocus,
  useRemotePlayPause,
} from './AudioService';
import { getSong, getSleepTimer, getAutoPlayEnabled } from './StorageService';

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  isReady: boolean;
  hasSong: boolean;
  song: Song | null;
}

export function usePlaybackController() {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    isReady: false,
    hasSong: false,
    song: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const init = useCallback(async () => {
    await setupPlayer();

    const savedSong = await getSong();
    const savedTimer = await getSleepTimer();

    if (savedSong) {
      await loadSong(savedSong);
      if (savedTimer) {
        const { setSleepTimer } = await import('./SleepTimer');
        setSleepTimer(savedTimer);
      }
      const autoPlay = await getAutoPlayEnabled();
      if (autoPlay) {
        await play();
      }
    }

    const playbackState = await getPlaybackState();
    const { position, duration } = await getProgress();

    setState({
      isPlaying: playbackState === State.Playing,
      position,
      duration,
      isReady: true,
      hasSong: !!savedSong,
      song: savedSong,
    });
  }, []);

  const togglePlay = useCallback(async () => {
    if (stateRef.current.isPlaying) {
      await pause();
    } else {
      await play();
    }
    const playbackState = await getPlaybackState();
    setState(s => ({ ...s, isPlaying: playbackState === State.Playing }));
  }, []);

  const seek = useCallback(async (time: number) => {
    await seekTo(time);
    setState(s => ({ ...s, position: time }));
  }, []);

  const refreshProgress = useCallback(async () => {
    try {
      const { position, duration } = await getProgress();
      setState(s => ({ ...s, position, duration }));
    } catch {
      // Player not ready yet
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const playbackState = await getPlaybackState();
      const isPlaying = playbackState === State.Playing;
      setState(s => ({ ...s, isPlaying }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useAudioFocus(event => {
    if (event.type === 'focus_lost' && event.permanent) {
      setState(s => ({ ...s, isPlaying: false }));
    } else if (event.type === 'focus_gained') {
      setState(s => ({ ...s, isPlaying: true }));
    }
  });

  useRemotePlayPause(
    async () => {
      await play();
      setState(s => ({ ...s, isPlaying: true }));
    },
    async () => {
      await pause();
      setState(s => ({ ...s, isPlaying: false }));
    },
  );

  return {
    ...state,
    togglePlay,
    seek,
    refreshProgress,
  };
}

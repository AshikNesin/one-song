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
import { getSong, getSleepTimer, getAutoPlayEnabled, clearAll } from './StorageService';

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  isReady: boolean;
  hasSong: boolean;
  song: Song | null;
  initError: boolean;
}

export function usePlaybackController() {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    isReady: false,
    hasSong: false,
    song: null,
    initError: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const mountedRef = useRef(true);

  const safeSetState = useCallback((updater: (s: PlaybackState) => PlaybackState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);

  const init = useCallback(async () => {
    await setupPlayer();

    const savedSong = await getSong();
    const savedTimer = await getSleepTimer();

    if (savedSong) {
      try {
        await loadSong(savedSong);
        if (savedTimer) {
          const { setSleepTimer } = await import('./SleepTimer');
          setSleepTimer(savedTimer);
        }
        const autoPlay = await getAutoPlayEnabled();
        if (autoPlay) {
          await play();
        }
      } catch {
        await clearAll();
        safeSetState(s => ({ ...s, hasSong: false, song: null, isReady: true, initError: true }));
        return;
      }
    }

    const playbackState = await getPlaybackState();
    const { position, duration } = await getProgress();

    safeSetState(s => ({
      ...s,
      isPlaying: playbackState === State.Playing,
      position,
      duration,
      isReady: true,
      hasSong: !!savedSong,
      song: savedSong,
    }));
  }, [safeSetState]);

  const togglePlay = useCallback(async () => {
    if (stateRef.current.isPlaying) {
      await pause();
    } else {
      await play();
    }
    const playbackState = await getPlaybackState();
    safeSetState(s => ({ ...s, isPlaying: playbackState === State.Playing }));
  }, [safeSetState]);

  const seek = useCallback(async (time: number) => {
    await seekTo(time);
    safeSetState(s => ({ ...s, position: time }));
  }, [safeSetState]);

  useEffect(() => {
    mountedRef.current = true;
    init();
    return () => {
      mountedRef.current = false;
    };
  }, [init]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const playbackState = await getPlaybackState();
        const { position, duration } = await getProgress();
        const isPlaying = playbackState === State.Playing;
        safeSetState(s => ({ ...s, isPlaying, position, duration }));
      } catch {
        // Player not ready yet
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [safeSetState]);

  useAudioFocus(event => {
    if (event.type === 'focus_lost' && event.permanent) {
      safeSetState(s => ({ ...s, isPlaying: false }));
    } else if (event.type === 'focus_gained') {
      safeSetState(s => ({ ...s, isPlaying: true }));
    }
  });

  useRemotePlayPause(
    async () => {
      await play();
      safeSetState(s => ({ ...s, isPlaying: true }));
    },
    async () => {
      await pause();
      safeSetState(s => ({ ...s, isPlaying: false }));
    },
  );

  return {
    ...state,
    togglePlay,
    seek,
  };
}

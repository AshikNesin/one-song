import { State } from 'react-native-track-player';
import { Song } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setupPlayer,
  loadSong,
  play,
  pause,
  getPlaybackState,
  getProgress,
  seekTo,
} from './AudioService';
import { getSong, clearSongData } from './SongIntake';
import { restoreTimer } from './SleepTimer';
import { STORAGE_KEYS } from '../utils/constants';

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  isReady: boolean;
  hasSong: boolean;
  song: Song | null;
  initError: boolean;
}

let state: PlaybackState = {
  isPlaying: false,
  position: 0,
  duration: 0,
  isReady: false,
  hasSong: false,
  song: null,
  initError: false,
};

const listeners = new Set<(state: PlaybackState) => void>();
let pollInterval: ReturnType<typeof setInterval> | null = null;

function notify() {
  listeners.forEach(l => l(state));
}

export function subscribe(listener: (state: PlaybackState) => void): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function getState(): PlaybackState {
  return state;
}

export async function getAutoPlayEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTOPLAY_ENABLED);
  return value !== 'false';
}

export async function saveAutoPlayEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AUTOPLAY_ENABLED, String(enabled));
}

export async function clearAutoPlay(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTOPLAY_ENABLED);
}

export async function init(): Promise<void> {
  await setupPlayer();

  const savedSong = await getSong();
  if (savedSong) {
    try {
      await loadSong(savedSong);
      await restoreTimer();
      const autoPlay = await getAutoPlayEnabled();
      if (autoPlay) {
        await play();
      }
    } catch {
      await clearSongData();
      state = { ...state, hasSong: false, song: null, isReady: true, initError: true };
      notify();
      return;
    }
  }

  const playbackState = await getPlaybackState();
  const { position, duration } = await getProgress();

  state = {
    isPlaying: playbackState === State.Playing,
    position,
    duration,
    isReady: true,
    hasSong: !!savedSong,
    song: savedSong,
    initError: false,
  };
  notify();
}

export async function togglePlay(): Promise<void> {
  if (state.isPlaying) {
    await pause();
  } else {
    await play();
  }
  const playbackState = await getPlaybackState();
  state = { ...state, isPlaying: playbackState === State.Playing };
  notify();
}

export async function seek(time: number): Promise<void> {
  await seekTo(time);
  state = { ...state, position: time };
  notify();
}

export function startPolling(): void {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    try {
      const playbackState = await getPlaybackState();
      const { position, duration } = await getProgress();
      const isPlaying = playbackState === State.Playing;
      state = { ...state, isPlaying, position, duration };
      notify();
    } catch {
      // Player not ready yet
    }
  }, 1000);
}

export function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

export function handleAudioFocus(event: { type: 'focus_lost' | 'focus_gained'; permanent: boolean }): void {
  if (event.type === 'focus_lost' && event.permanent) {
    state = { ...state, isPlaying: false };
    notify();
  } else if (event.type === 'focus_gained') {
    state = { ...state, isPlaying: true };
    notify();
  }
}

export async function handleRemotePlay(): Promise<void> {
  await play();
  state = { ...state, isPlaying: true };
  notify();
}

export async function handleRemotePause(): Promise<void> {
  await pause();
  state = { ...state, isPlaying: false };
  notify();
}

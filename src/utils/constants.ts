import { SleepTimerPreset } from '../types';

export const SLEEP_TIMER_PRESETS: SleepTimerPreset[] = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '60 min', minutes: 60 },
];

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: '@onesong:onboarding_complete',
  SELECTED_SONG: '@onesong:selected_song',
  SLEEP_TIMER: '@onesong:sleep_timer',
} as const;

export const DEFAULT_SONG_TITLE = 'Unknown Song';
export const DEFAULT_ARTIST = 'Unknown Artist';

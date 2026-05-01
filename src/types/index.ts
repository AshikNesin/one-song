export interface Song {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  url: string;
  duration: number;
}

export interface AppState {
  hasCompletedOnboarding: boolean;
  selectedSong: Song | null;
  sleepTimerMinutes: number | null;
}

export interface SleepTimerPreset {
  label: string;
  minutes: number;
}

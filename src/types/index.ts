export interface Song {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  url: string;
  duration: number;
}

export interface SleepTimerPreset {
  label: string;
  minutes: number;
}

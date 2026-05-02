import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import { Song } from '@/types';

export interface AudioFocusEvent {
  type: 'focus_lost' | 'focus_gained';
  permanent: boolean;
}

export async function setupPlayer(): Promise<void> {
  try {
    await TrackPlayer.setupPlayer();
  } catch (e: any) {
    if (e.message?.includes('already been initialized')) {
      // Player already set up, continue with options update
    } else {
      throw e;
    }
  }
  await TrackPlayer.updateOptions({
    capabilities: [Capability.Play, Capability.Pause, Capability.SeekTo],
    notificationCapabilities: [Capability.Play, Capability.Pause],
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
  });
  await TrackPlayer.setRepeatMode(RepeatMode.Track);
}

export async function loadSong(song: Song): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: song.id,
    url: song.url,
    title: song.title,
    artist: song.artist,
    artwork: song.artwork,
    duration: song.duration,
  });
}

export async function play(): Promise<void> {
  await TrackPlayer.play();
}

export async function pause(): Promise<void> {
  await TrackPlayer.pause();
}

export async function seekTo(seconds: number): Promise<void> {
  await TrackPlayer.seekTo(seconds);
}

export async function getProgress(): Promise<{ position: number; duration: number }> {
  const progress = await TrackPlayer.getProgress();
  return { position: progress.position, duration: progress.duration };
}

export async function getPlaybackState(): Promise<State> {
  const playbackState = await TrackPlayer.getPlaybackState();
  return playbackState.state;
}

export function usePlaybackState(callback: (state: State) => void): void {
  useTrackPlayerEvents([Event.PlaybackState], async event => {
    callback(event.state);
  });
}

export function useRemotePlayPause(
  onPlay: () => void,
  onPause: () => void,
): void {
  useTrackPlayerEvents([Event.RemotePlay, Event.RemotePause], async event => {
    if (event.type === Event.RemotePlay) {
      onPlay();
    } else if (event.type === Event.RemotePause) {
      onPause();
    }
  });
}

export function useAudioFocus(callback: (event: AudioFocusEvent) => void): void {
  useTrackPlayerEvents([Event.RemoteDuck], async event => {
    if (event.permanent) {
      callback({ type: 'focus_lost', permanent: true });
    } else {
      callback({ type: event.paused ? 'focus_lost' : 'focus_gained', permanent: false });
    }
  });
}

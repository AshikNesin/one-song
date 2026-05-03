import TrackPlayer, { Event, State, RepeatMode } from 'react-native-track-player';
import {
  setupPlayer,
  loadSong,
  play,
  pause,
  seekTo,
  getProgress,
  getPlaybackState,
  useRemotePlayPause,
  useAudioFocus,
} from '@/services/AudioService';

describe('AudioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TrackPlayer.setupPlayer.mockResolvedValue(undefined);
    TrackPlayer.updateOptions.mockResolvedValue(undefined);
    TrackPlayer.setRepeatMode.mockResolvedValue(undefined);
    TrackPlayer.reset.mockResolvedValue(undefined);
    TrackPlayer.add.mockResolvedValue(undefined);
    TrackPlayer.play.mockResolvedValue(undefined);
    TrackPlayer.pause.mockResolvedValue(undefined);
    TrackPlayer.seekTo.mockResolvedValue(undefined);
    TrackPlayer.getProgress.mockResolvedValue({ position: 30, duration: 180 });
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Playing });
  });

  describe('setupPlayer', () => {
    it('sets up player with correct options', async () => {
      await setupPlayer();
      expect(TrackPlayer.setupPlayer).toHaveBeenCalled();
      expect(TrackPlayer.updateOptions).toHaveBeenCalled();
      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Track);
    });

    it('handles already initialized error gracefully', async () => {
      const error = new Error('The player has already been initialized');
      TrackPlayer.setupPlayer.mockRejectedValueOnce(error);
      await expect(setupPlayer()).resolves.not.toThrow();
    });

    it('re-throws unexpected errors', async () => {
      const error = new Error('Unknown error');
      TrackPlayer.setupPlayer.mockRejectedValueOnce(error);
      await expect(setupPlayer()).rejects.toThrow('Unknown error');
    });
  });

  describe('loadSong', () => {
    it('resets and adds song to queue', async () => {
      const song = {
        id: 'test-id',
        title: 'Test Song',
        artist: 'Test Artist',
        url: 'file:///test.mp3',
        duration: 180,
      };
      await loadSong(song);
      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalledWith({
        id: song.id,
        url: song.url,
        title: song.title,
        artist: song.artist,
        artwork: undefined,
        duration: song.duration,
      });
    });
  });

  describe('playback controls', () => {
    it('plays', async () => {
      await play();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('pauses', async () => {
      await pause();
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('seeks to position', async () => {
      await seekTo(60);
      expect(TrackPlayer.seekTo).toHaveBeenCalledWith(60);
    });
  });

  describe('getProgress', () => {
    it('returns position and duration', async () => {
      const result = await getProgress();
      expect(result).toEqual({ position: 30, duration: 180 });
    });
  });

  describe('getPlaybackState', () => {
    it('returns current state', async () => {
      const result = await getPlaybackState();
      expect(result).toBe(State.Playing);
    });
  });

  describe('useRemotePlayPause', () => {
    it('registers RemotePlay and RemotePause event listeners', () => {
      const { useTrackPlayerEvents } = require('react-native-track-player');
      const onPlay = jest.fn();
      const onPause = jest.fn();
      useRemotePlayPause(onPlay, onPause);
      expect(useTrackPlayerEvents).toHaveBeenCalledWith(
        [Event.RemotePlay, Event.RemotePause],
        expect.any(Function),
      );
    });
  });

  describe('useAudioFocus', () => {
    it('registers RemoteDuck event listener', () => {
      const { useTrackPlayerEvents } = require('react-native-track-player');
      const callback = jest.fn();
      useAudioFocus(callback);
      expect(useTrackPlayerEvents).toHaveBeenCalledWith(
        [Event.RemoteDuck],
        expect.any(Function),
      );
    });
  });
});

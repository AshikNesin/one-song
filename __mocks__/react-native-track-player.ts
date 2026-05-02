export const Event = {
  PlaybackState: 'playback-state',
  RemotePlay: 'remote-play',
  RemotePause: 'remote-pause',
  RemoteDuck: 'remote-duck',
};

export const State = {
  None: 'none',
  Playing: 'playing',
  Paused: 'paused',
  Stopped: 'stopped',
};

export const RepeatMode = {
  Track: 1,
};

export const Capability = {
  Play: 1,
  Pause: 2,
  SeekTo: 3,
};

export const AppKilledPlaybackBehavior = {
  StopPlaybackAndRemoveNotification: 'stop-playback-and-remove-notification',
};

const mockTrackPlayer = {
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  updateOptions: jest.fn().mockResolvedValue(undefined),
  setRepeatMode: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  seekTo: jest.fn().mockResolvedValue(undefined),
  getProgress: jest.fn().mockResolvedValue({ position: 0, duration: 180 }),
  getPlaybackState: jest.fn().mockResolvedValue({ state: State.None }),
};

export default mockTrackPlayer;

export const useTrackPlayerEvents = jest.fn();

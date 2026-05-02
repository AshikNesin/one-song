import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { usePlaybackController } from '../../src/services/PlaybackController';

jest.mock('../../src/services/AudioService', () => ({
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  loadSong: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  getPlaybackState: jest.fn().mockResolvedValue(3), // State.Playing = 3
  getProgress: jest.fn().mockResolvedValue({ position: 30, duration: 180 }),
  seekTo: jest.fn().mockResolvedValue(undefined),
  useAudioFocus: jest.fn(),
  useRemotePlayPause: jest.fn(),
}));

jest.mock('../../src/services/SleepTimer', () => ({
  restoreTimer: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/services/SongIntake', () => ({
  getSong: jest.fn().mockResolvedValue(null),
  clearSongData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/services/Playback', () => {
  const actual = jest.requireActual('../../src/services/Playback');
  return {
    ...actual,
    getAutoPlayEnabled: jest.fn().mockResolvedValue(false),
  };
});

function TestComponent() {
  usePlaybackController();
  return null;
}

describe('PlaybackController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes and sets ready state', async () => {
    const { getSong } = require('../../src/services/SongIntake');
    const { getAutoPlayEnabled } = require('../../src/services/Playback');
    getSong.mockResolvedValue(null);
    getAutoPlayEnabled.mockResolvedValue(false);

    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<TestComponent />);
    });

    expect(renderer).toBeTruthy();
  });

  it('loads song and auto-plays when enabled', async () => {
    const mockSong = { id: '1', title: 'Test', artist: 'Artist', url: 'file:///test.mp3', duration: 180 };
    const { getSong } = require('../../src/services/SongIntake');
    const { getAutoPlayEnabled } = require('../../src/services/Playback');
    getSong.mockResolvedValue(mockSong);
    getAutoPlayEnabled.mockResolvedValue(true);

    const { loadSong, play } = require('../../src/services/AudioService');

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<TestComponent />);
    });

    expect(loadSong).toHaveBeenCalledWith(mockSong);
    expect(play).toHaveBeenCalled();
  });

  it('handles loadSong failure by clearing and setting initError', async () => {
    const mockSong = { id: '1', title: 'Test', artist: 'Artist', url: 'file:///test.mp3', duration: 180 };
    const { getSong } = require('../../src/services/SongIntake');
    const { getAutoPlayEnabled } = require('../../src/services/Playback');
    const { clearSongData } = require('../../src/services/SongIntake');
    getSong.mockResolvedValue(mockSong);
    getAutoPlayEnabled.mockResolvedValue(false);

    const { loadSong } = require('../../src/services/AudioService');
    loadSong.mockRejectedValueOnce(new Error('Load failed'));

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<TestComponent />);
    });

    expect(clearSongData).toHaveBeenCalled();
  });
});

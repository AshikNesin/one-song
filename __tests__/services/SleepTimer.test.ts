import TrackPlayer from 'react-native-track-player';
import {
  setSleepTimer,
  clearSleepTimer,
  getDefaultSleepTimer,
  setDefaultSleepTimer,
} from '../../src/services/SleepTimer';
import { getSleepTimer, saveSleepTimer } from '../../src/services/StorageService';

jest.mock('../../src/services/StorageService');

describe('SleepTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearSleepTimer();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('active timer', () => {
    it('sets a timer that pauses playback', () => {
      setSleepTimer(0.05); // 3 seconds for fast test
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
      jest.advanceTimersByTime(3000);
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('clears existing timer before setting new one', () => {
      setSleepTimer(1);
      setSleepTimer(2);
      jest.advanceTimersByTime(60000);
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
      jest.advanceTimersByTime(60000);
      expect(TrackPlayer.pause).toHaveBeenCalledTimes(1);
    });

    it('does nothing when minutes is null', () => {
      setSleepTimer(null);
      jest.advanceTimersByTime(100000);
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
    });

    it('clears sleep timer', () => {
      setSleepTimer(1);
      clearSleepTimer();
      jest.advanceTimersByTime(70000);
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
    });
  });

  describe('default timer', () => {
    it('gets default sleep timer from storage', async () => {
      (getSleepTimer as jest.Mock).mockResolvedValue(15);
      const result = await getDefaultSleepTimer();
      expect(result).toBe(15);
      expect(getSleepTimer).toHaveBeenCalled();
    });

    it('sets default sleep timer in storage', async () => {
      await setDefaultSleepTimer(30);
      expect(saveSleepTimer).toHaveBeenCalledWith(30);
    });

    it('clears default sleep timer when null', async () => {
      await setDefaultSleepTimer(null);
      expect(saveSleepTimer).toHaveBeenCalledWith(null);
    });
  });
});

import TrackPlayer from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setTimer,
  clearTimer,
  getDefaultTimer,
  setDefaultTimer,
  restoreTimer,
} from '@/services/SleepTimer';
import { STORAGE_KEYS } from '@/utils/constants';

describe('SleepTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('active timer', () => {
    it('sets a timer that pauses playback', async () => {
      await setTimer(0.05); // 3 seconds for fast test
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
      jest.advanceTimersByTime(3000);
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('clears existing timer before setting new one', async () => {
      await setTimer(1);
      await setTimer(2);
      jest.advanceTimersByTime(60000);
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
      jest.advanceTimersByTime(60000);
      expect(TrackPlayer.pause).toHaveBeenCalledTimes(1);
    });

    it('does nothing when minutes is null', async () => {
      await setTimer(null);
      jest.advanceTimersByTime(100000);
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
    });

    it('clears sleep timer', async () => {
      await setTimer(1);
      await clearTimer();
      jest.advanceTimersByTime(70000);
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
    });
  });

  describe('default timer', () => {
    it('gets default sleep timer from storage', async () => {
      AsyncStorage.getItem.mockResolvedValue('15');
      const result = await getDefaultTimer();
      expect(result).toBe(15);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.SLEEP_TIMER);
    });

    it('sets default sleep timer in storage', async () => {
      await setDefaultTimer(30);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.SLEEP_TIMER, '30');
    });

    it('clears default sleep timer when null', async () => {
      await setDefaultTimer(null);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.SLEEP_TIMER);
    });
  });

  describe('restoreTimer', () => {
    it('sets active timer from default', async () => {
      AsyncStorage.getItem.mockResolvedValue('10');
      await restoreTimer();
      jest.advanceTimersByTime(600000);
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('does nothing when no default is set', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      await restoreTimer();
      jest.advanceTimersByTime(100000);
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
    });
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { pause } from '@/services/AudioService';
import {
  setTimer,
  clearTimer,
  checkExpiry,
  loadDefaultTimer,
  saveDefaultTimer,
  restoreTimer,
} from '@/services/SleepTimer';

jest.mock('@/services/AudioService', () => ({
  pause: jest.fn().mockResolvedValue(undefined),
}));

const mockPause = pause as jest.Mock;

describe('SleepTimer', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    await clearTimer();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('active timer', () => {
    it('sets a timer that pauses on expiry', async () => {
      await setTimer(0.05); // 3 seconds for fast test
      expect(mockPause).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(3000);
      expect(mockPause).toHaveBeenCalled();
    });

    it('clears existing timer before setting new one', async () => {
      await setTimer(1);
      await setTimer(2);
      await jest.advanceTimersByTimeAsync(60000);
      expect(mockPause).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(60000);
      expect(mockPause).toHaveBeenCalledTimes(1);
    });

    it('does nothing when minutes is null', async () => {
      await setTimer(null);
      await jest.advanceTimersByTimeAsync(100000);
      expect(mockPause).not.toHaveBeenCalled();
    });

    it('clears sleep timer', async () => {
      await setTimer(1);
      await clearTimer();
      await jest.advanceTimersByTimeAsync(70000);
      expect(mockPause).not.toHaveBeenCalled();
    });

    it('persists the absolute expiry deadline', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      await setTimer(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@onesong:sleep_timer_expires_at',
        String(now + 60000),
      );
      jest.restoreAllMocks();
    });
  });

  describe('checkExpiry', () => {
    it('does nothing when no timer is active', async () => {
      await checkExpiry();
      expect(mockPause).not.toHaveBeenCalled();
    });

    it('does nothing before expiry time', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      await setTimer(1);
      jest.spyOn(Date, 'now').mockReturnValue(now + 30000);
      await checkExpiry();
      expect(mockPause).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('pauses when expiry time is reached', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      await setTimer(1);
      jest.spyOn(Date, 'now').mockReturnValue(now + 60001);
      await checkExpiry();
      expect(mockPause).toHaveBeenCalledTimes(1);
      jest.restoreAllMocks();
    });

    it('is idempotent - does not pause twice', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      await setTimer(1);
      jest.spyOn(Date, 'now').mockReturnValue(now + 60001);
      await checkExpiry();
      await checkExpiry();
      expect(mockPause).toHaveBeenCalledTimes(1);
      jest.restoreAllMocks();
    });

    it('does not pause after clearTimer', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      await setTimer(1);
      await clearTimer();
      jest.spyOn(Date, 'now').mockReturnValue(now + 60001);
      await checkExpiry();
      expect(mockPause).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('recovers the deadline from storage when in-memory state is missing', async () => {
      const now = Date.now();
      // Simulate a fresh runtime: only the persisted deadline exists.
      await AsyncStorage.setItem('@onesong:sleep_timer_expires_at', String(now - 1));
      await checkExpiry();
      expect(mockPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('default timer', () => {
    it('gets default sleep timer from storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('15');
      const result = await loadDefaultTimer();
      expect(result).toBe(15);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@onesong:sleep_timer');
    });

    it('sets default sleep timer in storage', async () => {
      await saveDefaultTimer(30);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@onesong:sleep_timer', '30');
    });

    it('clears default sleep timer when null', async () => {
      await saveDefaultTimer(null);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@onesong:sleep_timer');
    });
  });

  describe('restoreTimer', () => {
    it('re-arms active timer from default preference', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('10');
      await restoreTimer();
      await jest.advanceTimersByTimeAsync(600000);
      expect(mockPause).toHaveBeenCalled();
    });

    it('does nothing when no default is set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      await restoreTimer();
      await jest.advanceTimersByTimeAsync(100000);
      expect(mockPause).not.toHaveBeenCalled();
    });
  });
});

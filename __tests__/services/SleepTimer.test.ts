import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setTimer,
  clearTimer,
  loadDefaultTimer,
  saveDefaultTimer,
  restoreTimer,
} from '@/services/SleepTimer';

describe('SleepTimer', () => {
  const mockOnExpire = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('active timer', () => {
    it('sets a timer that calls onExpire', async () => {
      await setTimer(0.05, mockOnExpire); // 3 seconds for fast test
      expect(mockOnExpire).not.toHaveBeenCalled();
      jest.advanceTimersByTime(3000);
      expect(mockOnExpire).toHaveBeenCalled();
    });

    it('clears existing timer before setting new one', async () => {
      await setTimer(1, mockOnExpire);
      await setTimer(2, mockOnExpire);
      jest.advanceTimersByTime(60000);
      expect(mockOnExpire).not.toHaveBeenCalled();
      jest.advanceTimersByTime(60000);
      expect(mockOnExpire).toHaveBeenCalledTimes(1);
    });

    it('does nothing when minutes is null', async () => {
      await setTimer(null, mockOnExpire);
      jest.advanceTimersByTime(100000);
      expect(mockOnExpire).not.toHaveBeenCalled();
    });

    it('clears sleep timer', async () => {
      await setTimer(1, mockOnExpire);
      await clearTimer();
      jest.advanceTimersByTime(70000);
      expect(mockOnExpire).not.toHaveBeenCalled();
    });
  });

  describe('default timer', () => {
    it('gets default sleep timer from storage', async () => {
      AsyncStorage.getItem.mockResolvedValue('15');
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
    it('sets active timer from default with onExpire callback', async () => {
      AsyncStorage.getItem.mockResolvedValue('10');
      await restoreTimer(mockOnExpire);
      jest.advanceTimersByTime(600000);
      expect(mockOnExpire).toHaveBeenCalled();
    });

    it('does nothing when no default is set', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      await restoreTimer(mockOnExpire);
      jest.advanceTimersByTime(100000);
      expect(mockOnExpire).not.toHaveBeenCalled();
    });
  });
});

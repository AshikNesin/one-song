import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveSong,
  getSong,
  saveSleepTimer,
  getSleepTimer,
  setOnboardingComplete,
  hasCompletedOnboarding,
  saveAutoPlayEnabled,
  getAutoPlayEnabled,
  clearAll,
} from '../../src/services/StorageService';
import { STORAGE_KEYS } from '../../src/utils/constants';

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.setItem.mockClear();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.removeItem.mockClear();
    AsyncStorage.multiRemove.mockClear();
  });

  describe('Song', () => {
    const mockSong = {
      id: 'test-id',
      title: 'Test Song',
      artist: 'Test Artist',
      url: 'file:///test.mp3',
      duration: 180,
    };

    it('saves a song', async () => {
      await saveSong(mockSong);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SELECTED_SONG,
        JSON.stringify(mockSong),
      );
    });

    it('returns null when no song is saved', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const song = await getSong();
      expect(song).toBeNull();
    });

    it('returns saved song', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSong));
      const song = await getSong();
      expect(song).toEqual(mockSong);
    });
  });

  describe('Sleep Timer', () => {
    it('saves sleep timer minutes', async () => {
      await saveSleepTimer(30);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SLEEP_TIMER,
        '30',
      );
    });

    it('removes sleep timer when null', async () => {
      await saveSleepTimer(null);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SLEEP_TIMER,
      );
    });

    it('returns null when no timer is set', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const timer = await getSleepTimer();
      expect(timer).toBeNull();
    });

    it('returns saved timer minutes', async () => {
      AsyncStorage.getItem.mockResolvedValue('30');
      const timer = await getSleepTimer();
      expect(timer).toBe(30);
    });
  });

  describe('Onboarding', () => {
    it('marks onboarding as complete', async () => {
      await setOnboardingComplete();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        'true',
      );
    });

    it('returns false when onboarding is not complete', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const complete = await hasCompletedOnboarding();
      expect(complete).toBe(false);
    });

    it('returns true when onboarding is complete', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');
      const complete = await hasCompletedOnboarding();
      expect(complete).toBe(true);
    });
  });

  describe('AutoPlay', () => {
    it('saves auto-play enabled state', async () => {
      await saveAutoPlayEnabled(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.AUTOPLAY_ENABLED,
        'false',
      );
    });

    it('defaults to true when no value is set', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const enabled = await getAutoPlayEnabled();
      expect(enabled).toBe(true);
    });

    it('returns false when explicitly disabled', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');
      const enabled = await getAutoPlayEnabled();
      expect(enabled).toBe(false);
    });

    it('returns true when explicitly enabled', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');
      const enabled = await getAutoPlayEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('removes all storage keys', async () => {
      await clearAll();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        STORAGE_KEYS.SELECTED_SONG,
        STORAGE_KEYS.SLEEP_TIMER,
        STORAGE_KEYS.AUTOPLAY_ENABLED,
      ]);
    });
  });
});

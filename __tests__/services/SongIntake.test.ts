import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import {
  intake,
  complete,
  getSong,
  hasCompletedOnboarding,
  clearSongData,
} from '@/services/SongIntake';
import { requestStoragePermission, isPermissionBlocked } from '@/services/PermissionService';
import { extractMetadata } from '@/services/MetadataAdapter';
import { STORAGE_KEYS } from '@/utils/constants';

jest.mock('@react-native-documents/picker');
jest.mock('../../src/services/PermissionService');
jest.mock('../../src/services/MetadataAdapter');

const mockParseFilename = jest.fn();
jest.mock('@/utils/metadata', () => ({
  parseFilename: (...args: any[]) => mockParseFilename(...args),
}));

describe('SongIntake', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseFilename.mockImplementation((filename: string) => {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      return { title: nameWithoutExt || undefined };
    });
    (extractMetadata as jest.Mock).mockResolvedValue({});
  });

  describe('intake', () => {
    it('returns permission_denied when permission is not granted', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(false);
      (isPermissionBlocked as jest.Mock).mockResolvedValue(false);

      const result = await intake();

      expect(result).toEqual({ type: 'permission_denied', blocked: false });
    });

    it('returns permission_denied with blocked=true when permanently denied', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(false);
      (isPermissionBlocked as jest.Mock).mockResolvedValue(true);

      const result = await intake();

      expect(result).toEqual({ type: 'permission_denied', blocked: true });
    });

    it('returns pick_failed when user cancels picker', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([]);

      const result = await intake();

      expect(result).toEqual({ type: 'pick_failed' });
    });

    it('returns copy_failed when local copy fails', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([{ uri: 'file:///test.mp3', name: 'test.mp3' }]);
      (keepLocalCopy as jest.Mock).mockResolvedValue([{ status: 'error' }]);

      const result = await intake();

      expect(result).toEqual({ type: 'copy_failed' });
    });

    it('returns song on success', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([{ uri: 'file:///test.mp3', name: 'test.mp3' }]);
      (keepLocalCopy as jest.Mock).mockResolvedValue([{ status: 'success', localUri: 'file:///cache/test.mp3' }]);

      const result = await intake();

      expect('id' in result).toBe(true);
      if ('id' in result) {
        expect(result.title).toBe('test');
        expect(result.url).toBe('file:///cache/test.mp3');
      }
    });

    it('uses default title when file name is missing', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([{ uri: 'file:///test.mp3' }]);
      (keepLocalCopy as jest.Mock).mockResolvedValue([{ status: 'success', localUri: 'file:///cache/test.mp3' }]);

      const result = await intake();

      expect('id' in result).toBe(true);
      if ('id' in result) {
        expect(result.title).toBe('Unknown Song');
      }
    });

    it('returns pick_failed on exception', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockRejectedValue(new Error('Picker error'));

      const result = await intake();

      expect(result).toEqual({ type: 'pick_failed' });
    });
  });

  describe('complete', () => {
    it('saves song and marks onboarding complete', async () => {
      const song = {
        id: 'test-id',
        title: 'Test Song',
        artist: 'Test Artist',
        url: 'file:///test.mp3',
        duration: 180,
      };

      await complete(song);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SELECTED_SONG,
        JSON.stringify(song),
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        'true',
      );
    });
  });

  describe('getSong', () => {
    it('returns null when no song is saved', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const song = await getSong();
      expect(song).toBeNull();
    });

    it('returns saved song', async () => {
      const mockSong = {
        id: 'test-id',
        title: 'Test Song',
        artist: 'Test Artist',
        url: 'file:///test.mp3',
        duration: 180,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSong));
      const song = await getSong();
      expect(song).toEqual(mockSong);
    });
  });

  describe('hasCompletedOnboarding', () => {
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

  describe('clearSongData', () => {
    it('removes onboarding and song keys', async () => {
      await clearSongData();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        STORAGE_KEYS.SELECTED_SONG,
      ]);
    });
  });
});

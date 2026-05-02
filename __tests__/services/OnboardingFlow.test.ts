import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { pickSong, completeOnboarding } from '../../src/services/OnboardingFlow';
import { requestStoragePermission, isPermissionBlocked } from '../../src/services/PermissionService';
import { saveSong, setOnboardingComplete } from '../../src/services/StorageService';
import { extractMetadata, parseFilename } from '../../src/utils/metadata';

jest.mock('@react-native-documents/picker');
jest.mock('../../src/services/PermissionService');
jest.mock('../../src/services/StorageService');
jest.mock('../../src/utils/metadata');

describe('OnboardingFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (extractMetadata as jest.Mock).mockResolvedValue({});
    (parseFilename as jest.Mock).mockImplementation((filename: string) => {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      return { title: nameWithoutExt || undefined };
    });
  });

  describe('pickSong', () => {
    it('returns permission_denied when permission is not granted', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(false);
      (isPermissionBlocked as jest.Mock).mockResolvedValue(false);

      const result = await pickSong();

      expect(result).toEqual({ type: 'permission_denied', blocked: false });
    });

    it('returns permission_denied with blocked=true when permanently denied', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(false);
      (isPermissionBlocked as jest.Mock).mockResolvedValue(true);

      const result = await pickSong();

      expect(result).toEqual({ type: 'permission_denied', blocked: true });
    });

    it('returns pick_failed when user cancels picker', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([]);

      const result = await pickSong();

      expect(result).toEqual({ type: 'pick_failed' });
    });

    it('returns copy_failed when local copy fails', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([{ uri: 'file:///test.mp3', name: 'test.mp3' }]);
      (keepLocalCopy as jest.Mock).mockResolvedValue([{ status: 'error' }]);

      const result = await pickSong();

      expect(result).toEqual({ type: 'copy_failed' });
    });

    it('returns song on success', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([{ uri: 'file:///test.mp3', name: 'test.mp3' }]);
      (keepLocalCopy as jest.Mock).mockResolvedValue([{ status: 'success', localUri: 'file:///cache/test.mp3' }]);

      const result = await pickSong();

      expect('song' in result).toBe(true);
      if ('song' in result) {
        expect(result.song.title).toBe('test');
        expect(result.song.url).toBe('file:///cache/test.mp3');
      }
    });

    it('uses default title when file name is missing', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockResolvedValue([{ uri: 'file:///test.mp3' }]);
      (keepLocalCopy as jest.Mock).mockResolvedValue([{ status: 'success', localUri: 'file:///cache/test.mp3' }]);

      const result = await pickSong();

      expect('song' in result).toBe(true);
      if ('song' in result) {
        expect(result.song.title).toBe('Unknown Song');
      }
    });

    it('returns pick_failed on exception', async () => {
      (requestStoragePermission as jest.Mock).mockResolvedValue(true);
      (pick as jest.Mock).mockRejectedValue(new Error('Picker error'));

      const result = await pickSong();

      expect(result).toEqual({ type: 'pick_failed' });
    });
  });

  describe('completeOnboarding', () => {
    it('saves song and marks onboarding complete', async () => {
      const song = {
        id: 'test-id',
        title: 'Test Song',
        artist: 'Test Artist',
        url: 'file:///test.mp3',
        duration: 180,
      };

      await completeOnboarding(song);

      expect(saveSong).toHaveBeenCalledWith(song);
      expect(setOnboardingComplete).toHaveBeenCalled();
    });
  });
});

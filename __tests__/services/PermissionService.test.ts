import { Platform, Linking } from 'react-native';
import { check, request, RESULTS, PERMISSIONS } from 'react-native-permissions';
import {
  checkStoragePermission,
  requestStoragePermission,
  isPermissionBlocked,
  openAppSettings,
} from '@/services/PermissionService';

describe('PermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      Platform.Version = 33;
    });

    it('checkStoragePermission returns true when granted', async () => {
      check.mockResolvedValue(RESULTS.GRANTED);
      const result = await checkStoragePermission();
      expect(check).toHaveBeenCalledWith(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
      expect(result).toBe(true);
    });

    it('checkStoragePermission returns false when denied', async () => {
      check.mockResolvedValue(RESULTS.DENIED);
      const result = await checkStoragePermission();
      expect(result).toBe(false);
    });

    it('requestStoragePermission returns true when granted', async () => {
      request.mockResolvedValue(RESULTS.GRANTED);
      const result = await requestStoragePermission();
      expect(request).toHaveBeenCalledWith(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
      expect(result).toBe(true);
    });

    it('requestStoragePermission returns false when denied', async () => {
      request.mockResolvedValue(RESULTS.DENIED);
      const result = await requestStoragePermission();
      expect(result).toBe(false);
    });

    it('isPermissionBlocked returns true when blocked', async () => {
      check.mockResolvedValue(RESULTS.BLOCKED);
      const result = await isPermissionBlocked();
      expect(result).toBe(true);
    });

    it('isPermissionBlocked returns false when granted', async () => {
      check.mockResolvedValue(RESULTS.GRANTED);
      const result = await isPermissionBlocked();
      expect(result).toBe(false);
    });

    it('uses READ_EXTERNAL_STORAGE on Android < 33', async () => {
      Platform.Version = 30;
      check.mockResolvedValue(RESULTS.GRANTED);
      await checkStoragePermission();
      expect(check).toHaveBeenCalledWith(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    });

    it('openAppSettings opens app settings', () => {
      openAppSettings();
      expect(Linking.openSettings).toHaveBeenCalled();
    });
  });

  describe('iOS', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('checkStoragePermission returns true without checking', async () => {
      const result = await checkStoragePermission();
      expect(check).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('requestStoragePermission returns true without requesting', async () => {
      const result = await requestStoragePermission();
      expect(request).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('isPermissionBlocked returns false', async () => {
      const result = await isPermissionBlocked();
      expect(check).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});

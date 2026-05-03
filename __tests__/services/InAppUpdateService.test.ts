import { NativeModules } from 'react-native';
import { AndroidInstallStatus } from 'sp-react-native-in-app-updates';

jest.mock('sp-react-native-in-app-updates', () => {
  const mockSpInAppUpdates = jest.fn();
  mockSpInAppUpdates.prototype.checkNeedsUpdate = jest.fn();
  mockSpInAppUpdates.prototype.startUpdate = jest.fn();
  mockSpInAppUpdates.prototype.installUpdate = jest.fn();
  mockSpInAppUpdates.prototype.addStatusUpdateListener = jest.fn();

  return {
    __esModule: true,
    default: mockSpInAppUpdates,
    AndroidInstallStatus: {
      DOWNLOADING: 2,
      DOWNLOADED: 11,
      INSTALLING: 12,
      INSTALLED: 13,
      FAILED: 14,
      CANCELED: 15,
    },
    IAUUpdateKind: {
      FLEXIBLE: 'flexible',
      IMMEDIATE: 'immediate',
    },
  };
});

describe('InAppUpdateService', () => {
  let inAppUpdateService: {
    checkAndPromptUpdate: () => Promise<void>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = false;
  });

  function createService(devMode = false, nativeModulePresent = true) {
    global.__DEV__ = devMode;

    if (nativeModulePresent) {
      NativeModules.SpInAppUpdates = {};
    } else {
      delete NativeModules.SpInAppUpdates;
    }

    jest.isolateModules(() => {
      const mod = require('@/services/InAppUpdateService');
      inAppUpdateService = mod.inAppUpdateService;
    });
  }

  afterEach(() => {
    delete NativeModules.SpInAppUpdates;
  });

  describe('in dev mode', () => {
    it('skips update check entirely', async () => {
      createService(true);

      await inAppUpdateService.checkAndPromptUpdate();

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const instances = SpInAppUpdates.mock.instances;
      expect(instances).toHaveLength(0);
    });
  });

  describe('in production', () => {
    it('checks for updates and starts flexible update when android', async () => {
      createService(false);

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '0.0.7',
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.checkNeedsUpdate).toHaveBeenCalled();
      expect(instance.addStatusUpdateListener).toHaveBeenCalled();
      expect(instance.startUpdate).toHaveBeenCalledWith({
        updateType: 'flexible',
      });
    });

    it('does nothing when no update is available', async () => {
      createService(false);

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: false,
        storeVersion: '0.0.6',
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.addStatusUpdateListener).not.toHaveBeenCalled();
      expect(instance.startUpdate).not.toHaveBeenCalled();
    });

    it('silently catches errors in checkNeedsUpdate', async () => {
      createService(false);

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockRejectedValue(
        new Error('Play Store unavailable'),
      );

      await expect(
        inAppUpdateService.checkAndPromptUpdate(),
      ).resolves.toBeUndefined();

      expect(instance.startUpdate).not.toHaveBeenCalled();
    });

    it('handles DOWNLOADED status by calling installUpdate', async () => {
      createService(false);

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '0.0.7',
      });

      let statusListener: ((status: any) => void) | null = null;
      instance.addStatusUpdateListener.mockImplementation(
        (cb: (status: any) => void) => {
          statusListener = cb;
        },
      );

      await inAppUpdateService.checkAndPromptUpdate();

      expect(statusListener).not.toBeNull();

      statusListener!({
        status: AndroidInstallStatus.DOWNLOADED,
        bytesDownloaded: 100,
        totalBytesToDownload: 100,
      });

      expect(instance.installUpdate).toHaveBeenCalled();
    });

    it('ignores non-DOWNLOADED status updates', async () => {
      createService(false);

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '0.0.7',
      });

      let statusListener: ((status: any) => void) | null = null;
      instance.addStatusUpdateListener.mockImplementation(
        (cb: (status: any) => void) => {
          statusListener = cb;
        },
      );

      await inAppUpdateService.checkAndPromptUpdate();

      statusListener!({
        status: AndroidInstallStatus.DOWNLOADING,
        bytesDownloaded: 50,
        totalBytesToDownload: 100,
      });

      expect(instance.installUpdate).not.toHaveBeenCalled();
    });

    it('does nothing when native module is missing', async () => {
      createService(false, false);

      await inAppUpdateService.checkAndPromptUpdate();

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      expect(SpInAppUpdates).not.toHaveBeenCalled();
    });
  });
});

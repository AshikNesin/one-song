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
      FLEXIBLE: 0,
      IMMEDIATE: 1,
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
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  function createService(devMode = false, platform = 'android') {
    global.__DEV__ = devMode;
    jest.doMock('react-native', () => ({
      Platform: { OS: platform },
    }));
    jest.isolateModules(() => {
      const mod = require('@/services/InAppUpdateService');
      inAppUpdateService = mod.inAppUpdateService;
    });
    jest.dontMock('react-native');
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('in dev mode', () => {
    it('skips update check entirely', async () => {
      createService(true);

      await inAppUpdateService.checkAndPromptUpdate();

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      expect(SpInAppUpdates).not.toHaveBeenCalled();
    });
  });

  describe('in production', () => {
    it('starts flexible update when update is available', async () => {
      createService(false, 'android');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '0.0.14',
        other: {
          updateAvailability: 2,
          versionCode: 14,
        },
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.checkNeedsUpdate).toHaveBeenCalled();
      expect(instance.addStatusUpdateListener).toHaveBeenCalled();
      expect(instance.startUpdate).toHaveBeenCalledWith({
        updateType: 0,
      });
    });

    it('does nothing when no update is available', async () => {
      createService(false, 'android');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: false,
        other: {
          updateAvailability: 1,
        },
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.startUpdate).not.toHaveBeenCalled();
    });

    it('handles iOS update flow', async () => {
      createService(false, 'ios');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '0.0.14',
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.startUpdate).toHaveBeenCalledWith({
        title: 'Update Available',
        message: expect.any(String),
        buttonUpgradeText: 'Update',
        buttonCancelText: 'Later',
      });
    });

    it('logs errors without throwing', async () => {
      createService(false, 'android');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockRejectedValue(
        new Error('Play Store unavailable'),
      );

      await expect(
        inAppUpdateService.checkAndPromptUpdate(),
      ).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        'In-app update failed:',
        expect.any(Error),
      );
    });

    it('handles DOWNLOADED status by calling installUpdate', async () => {
      createService(false, 'android');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '0.0.14',
        other: {
          updateAvailability: 2,
          versionCode: 14,
        },
      });

      let statusListener: ((status: any) => void) | null = null;
      instance.addStatusUpdateListener.mockImplementation(
        (cb: (status: any) => void) => {
          statusListener = cb;
        },
      );

      await inAppUpdateService.checkAndPromptUpdate();

      expect(statusListener).not.toBeNull();

      const { AndroidInstallStatus } = require('sp-react-native-in-app-updates');
      statusListener!({
        status: AndroidInstallStatus.DOWNLOADED,
        bytesDownloaded: 100,
        totalBytesToDownload: 100,
      });

      expect(instance.installUpdate).toHaveBeenCalled();
    });

    it('handles DEVELOPER_TRIGGERED with flexible allowed', async () => {
      createService(false, 'android');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '14',
        other: {
          updateAvailability: 3,
          versionCode: 14,
          isFlexibleUpdateAllowed: true,
          isImmediateUpdateAllowed: false,
        },
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.startUpdate).toHaveBeenCalledWith({
        updateType: 0,
      });
    });

    it('handles DEVELOPER_TRIGGERED with only immediate allowed', async () => {
      createService(false, 'android');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '14',
        other: {
          updateAvailability: 3,
          versionCode: 14,
          isFlexibleUpdateAllowed: false,
          isImmediateUpdateAllowed: true,
        },
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.startUpdate).toHaveBeenCalledWith({
        updateType: 1,
      });
    });

    it('defaults to FLEXIBLE when DEVELOPER_TRIGGERED but neither type is explicitly allowed', async () => {
      createService(false, 'android');

      const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
      const [instance] = SpInAppUpdates.mock.instances;
      instance.checkNeedsUpdate.mockResolvedValue({
        shouldUpdate: true,
        storeVersion: '14',
        other: {
          updateAvailability: 3,
          versionCode: 14,
        },
      });

      await inAppUpdateService.checkAndPromptUpdate();

      expect(instance.startUpdate).toHaveBeenCalledWith({
        updateType: 0,
      });
    });
  });
});

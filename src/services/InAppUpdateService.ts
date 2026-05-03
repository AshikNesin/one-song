import { Platform } from 'react-native';
import SpInAppUpdates, {
  AndroidInstallStatus,
  IAUUpdateKind,
  StartUpdateOptions,
  StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';

const INSTALL_STATUS = AndroidInstallStatus;

class InAppUpdateService {
  private inAppUpdates: SpInAppUpdates | null = null;

  constructor() {
    if (!__DEV__) {
      this.inAppUpdates = new SpInAppUpdates(false);
    }
  }

  async checkAndPromptUpdate(): Promise<void> {
    if (__DEV__ || !this.inAppUpdates) {
      return;
    }

    try {
      const result = await this.inAppUpdates.checkNeedsUpdate();

      console.log('In-app update: check result', result);

      if (!result.shouldUpdate) {
        console.log('In-app update: no update needed');
        return;
      }

      if (Platform.OS === 'android') {
        await this.startAndroidFlexibleUpdate(result.other as Record<string, unknown>);
      } else {
        const updateOptions: StartUpdateOptions = {
          title: 'Update Available',
          message:
            'A new version of One Song is available. Update to get the latest features.',
          buttonUpgradeText: 'Update',
          buttonCancelText: 'Later',
        };
        await this.inAppUpdates.startUpdate(updateOptions);
      }
    } catch (error) {
      console.error('In-app update failed:', error);
    }
  }

  private async startAndroidFlexibleUpdate(
    other: Record<string, unknown> | undefined,
  ): Promise<void> {
    if (!this.inAppUpdates) {
      return;
    }

    this.inAppUpdates.addStatusUpdateListener((status: StatusUpdateEvent) => {
      console.log('In-app update: status', status.status);
      if (status.status === INSTALL_STATUS.DOWNLOADED) {
        console.log('In-app update: download complete, installing');
        this.inAppUpdates?.installUpdate();
      }
    });

    const isDeveloperTriggered = other?.updateAvailability === 3;

    let updateType = IAUUpdateKind.FLEXIBLE;

    if (isDeveloperTriggered) {
      if (other?.isImmediateUpdateAllowed) {
        updateType = IAUUpdateKind.IMMEDIATE;
      } else if (other?.isFlexibleUpdateAllowed) {
        updateType = IAUUpdateKind.FLEXIBLE;
      }
    }

    const updateOptions: StartUpdateOptions = {
      updateType,
    };

    await this.inAppUpdates.startUpdate(updateOptions);
    console.log('In-app update: update flow started', {
      updateType: updateType === IAUUpdateKind.IMMEDIATE ? 'IMMEDIATE' : 'FLEXIBLE',
      isDeveloperTriggered,
    });
  }
}

export const inAppUpdateService = new InAppUpdateService();

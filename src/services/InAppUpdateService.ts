import { NativeModules, Platform } from 'react-native';
import { getBuildNumber } from 'react-native-device-info';
import SpInAppUpdates, {
  AndroidInstallStatus,
  IAUAvailabilityStatus,
  IAUUpdateKind,
  NeedsUpdateResponse,
  StartUpdateOptions,
  StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';

const INSTALL_STATUS = AndroidInstallStatus;

class InAppUpdateService {
  private inAppUpdates: SpInAppUpdates | null = null;

  constructor() {
    if (!__DEV__ && NativeModules.SpInAppUpdates) {
      try {
        this.inAppUpdates = new SpInAppUpdates(false);
      } catch (_e) {
        this.inAppUpdates = null;
      }
    }
  }

  async checkAndPromptUpdate(): Promise<void> {
    if (__DEV__ || !this.inAppUpdates) {
      return;
    }

    try {
      const currentVersionCode = getBuildNumber();
      const result: NeedsUpdateResponse =
        await this.inAppUpdates.checkNeedsUpdate({
          curVersion: currentVersionCode,
        });

      const androidResult = result as NeedsUpdateResponse & {
        other?: { updateAvailability?: number };
      };
      const updateAvailability = androidResult.other?.updateAvailability;

      if (!result.shouldUpdate) {
        if (
          Platform.OS === 'android' &&
          updateAvailability === IAUAvailabilityStatus.DEVELOPER_TRIGGERED
        ) {
          console.log(
            'In-app update: update already triggered, continuing flexible update',
          );
          this.startFlexibleUpdate();
        }
        return;
      }

      console.log('In-app update: update available', result);

      if (Platform.OS === 'android') {
        this.startFlexibleUpdate();
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
      console.error('In-app update check failed:', error);
    }
  }

  private startFlexibleUpdate(): void {
    if (!this.inAppUpdates) {
      return;
    }

    this.inAppUpdates.addStatusUpdateListener(
      (status: StatusUpdateEvent) => {
        if (status.status === INSTALL_STATUS.DOWNLOADED) {
          this.inAppUpdates?.installUpdate();
        }
      },
    );

    const updateOptions: StartUpdateOptions = {
      updateType: IAUUpdateKind.FLEXIBLE,
    };
    this.inAppUpdates.startUpdate(updateOptions);
  }
}

export const inAppUpdateService = new InAppUpdateService();

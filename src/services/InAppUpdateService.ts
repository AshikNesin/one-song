import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  NeedsUpdateResponse,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';

class InAppUpdateService {
  private inAppUpdates: SpInAppUpdates;

  constructor() {
    this.inAppUpdates = new SpInAppUpdates(__DEV__);
  }

  async checkAndPromptUpdate(): Promise<void> {
    if (__DEV__) {
      return;
    }

    try {
      const result: NeedsUpdateResponse =
        await this.inAppUpdates.checkNeedsUpdate();

      if (!result.shouldUpdate) {
        return;
      }

      const updateOptions: StartUpdateOptions = Platform.select({
        ios: {
          title: 'Update Available',
          message:
            'A new version of One Song is available. Update to get the latest features.',
          buttonUpgradeText: 'Update',
          buttonCancelText: 'Later',
        },
        android: {
          updateType: IAUUpdateKind.FLEXIBLE,
        },
      }) as StartUpdateOptions;

      await this.inAppUpdates.startUpdate(updateOptions);
    } catch (_error) {
      // Silently fail — don't block the app if update check fails
    }
  }
}

export const inAppUpdateService = new InAppUpdateService();

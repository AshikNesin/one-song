import { NativeModules, Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  NeedsUpdateResponse,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';

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

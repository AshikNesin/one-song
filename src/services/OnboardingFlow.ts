import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { Song } from '../types';
import { requestStoragePermission, isPermissionBlocked, openAppSettings } from './PermissionService';
import { saveSong, setOnboardingComplete } from './StorageService';

export type OnboardingError =
  | { type: 'permission_denied'; blocked: boolean }
  | { type: 'pick_failed' }
  | { type: 'copy_failed' };

export interface OnboardingResult {
  song: Song;
}

export async function pickSong(): Promise<OnboardingResult | OnboardingError> {
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) {
    const blocked = await isPermissionBlocked();
    return { type: 'permission_denied', blocked };
  }

  try {
    const result = await pick({
      type: ['audio/*'],
    });

    if (result.length === 0) {
      return { type: 'pick_failed' };
    }

    const file = result[0];

    const localCopy = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: file.name ?? 'song.mp3' }],
      destination: 'cachesDirectory',
    });

    if (localCopy[0].status === 'error') {
      return { type: 'copy_failed' };
    }

    const song: Song = {
      id: localCopy[0].localUri,
      title: file.name ?? 'Unknown Song',
      artist: 'Unknown Artist',
      url: localCopy[0].localUri,
      duration: 0,
    };

    return { song };
  } catch {
    return { type: 'pick_failed' };
  }
}

export async function completeOnboarding(song: Song): Promise<void> {
  await saveSong(song);
  await setOnboardingComplete();
}

export { openAppSettings };

import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { Song } from '../types';
import { DEFAULT_SONG_TITLE, DEFAULT_ARTIST } from '../utils/constants';
import { extractMetadata, parseFilename } from '../utils/metadata';
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

    const metadata = await extractMetadata(localCopy[0].localUri);
    const parsedFilename = parseFilename(file.name ?? '');

    const song: Song = {
      id: localCopy[0].localUri,
      title: metadata.title || parsedFilename.title || file.name || DEFAULT_SONG_TITLE,
      artist: metadata.artist || parsedFilename.artist || DEFAULT_ARTIST,
      artwork: metadata.artwork,
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

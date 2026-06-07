import { Linking } from 'react-native';
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { Song } from '@/types';
import { DEFAULT_SONG_TITLE, DEFAULT_ARTIST } from '@/utils/constants';
import { parseFilename } from '@/utils/metadata';
import { extractMetadata } from '@/services/MetadataAdapter';
import { requestStoragePermission, isPermissionBlocked } from '@/services/PermissionService';
import * as Storage from '@/services/StorageService';

export type IntakeError =
  | { type: 'permission_denied'; blocked: boolean }
  | { type: 'pick_failed' }
  | { type: 'copy_failed' };

export async function intake(): Promise<Song | IntakeError> {
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) {
    const blocked = await isPermissionBlocked();
    return { type: 'permission_denied', blocked };
  }

  try {
    const result = await pick({
      type: ['audio/*', 'public.mpeg-4-audio', 'public.audio'],
    });

    if (result.length === 0) {
      return { type: 'pick_failed' };
    }

    const file = result[0];

    // Both Android and iOS benefit from keepLocalCopy:
    // - Android: content:// URIs lose permission across app restarts
    // - iOS: ensures a persistent file:// URI in the app cache
    const localCopy = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: file.name ?? 'song.mp3' }],
      destination: 'cachesDirectory',
    });

    if (localCopy[0].status === 'error') {
      return { type: 'copy_failed' };
    }

    const playbackUri = localCopy[0].localUri;

    const metadata = await extractMetadata(playbackUri);
    const parsedFilename = parseFilename(file.name ?? '');

    const song: Song = {
      id: playbackUri,
      title: metadata.title || parsedFilename.title || file.name || DEFAULT_SONG_TITLE,
      artist: metadata.artist || parsedFilename.artist || DEFAULT_ARTIST,
      artwork: metadata.artwork,
      url: playbackUri,
      duration: 0,
    };

    return song;
  } catch {
    return { type: 'pick_failed' };
  }
}

export async function complete(song: Song): Promise<void> {
  await Storage.setItem('SELECTED_SONG', JSON.stringify(song));
  await Storage.setItem('ONBOARDING_COMPLETE', 'true');
}

export async function getSong(): Promise<Song | null> {
  const data = await Storage.getItem('SELECTED_SONG');
  return data ? JSON.parse(data) : null;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await Storage.getItem('ONBOARDING_COMPLETE');
  return value === 'true';
}

export async function clearSongData(): Promise<void> {
  await Storage.multiRemove(['ONBOARDING_COMPLETE', 'SELECTED_SONG']);
}

export function openAppSettings(): void {
  Linking.openSettings();
}

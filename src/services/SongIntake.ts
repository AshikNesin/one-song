import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { Song } from '../types';
import { STORAGE_KEYS, DEFAULT_SONG_TITLE, DEFAULT_ARTIST } from '../utils/constants';
import { parseFilename } from '../utils/metadata';
import { extractMetadata } from './MetadataAdapter';
import { requestStoragePermission, isPermissionBlocked } from './PermissionService';

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

    return song;
  } catch {
    return { type: 'pick_failed' };
  }
}

export async function complete(song: Song): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SONG, JSON.stringify(song));
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

export async function getSong(): Promise<Song | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SONG);
  return data ? JSON.parse(data) : null;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  return value === 'true';
}

export async function clearSongData(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ONBOARDING_COMPLETE,
    STORAGE_KEYS.SELECTED_SONG,
  ]);
}

export function openAppSettings(): void {
  Linking.openSettings();
}

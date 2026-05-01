import { Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

export async function checkStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permission =
    Platform.Version >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_AUDIO
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

  const result = await check(permission);
  return result === RESULTS.GRANTED;
}

export async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permission =
    Platform.Version >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_AUDIO
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

  const result = await request(permission);
  return result === RESULTS.GRANTED;
}

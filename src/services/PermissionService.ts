import { Platform, Linking } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

function getStoragePermission() {
  if (Platform.OS !== 'android') return null;
  return Platform.Version >= 33
    ? PERMISSIONS.ANDROID.READ_MEDIA_AUDIO
    : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
}

export async function checkStoragePermission(): Promise<boolean> {
  const permission = getStoragePermission();
  if (!permission) return true;
  const result = await check(permission);
  return result === RESULTS.GRANTED;
}

export async function requestStoragePermission(): Promise<boolean> {
  const permission = getStoragePermission();
  if (!permission) return true;
  const result = await request(permission);
  return result === RESULTS.GRANTED;
}

export async function isPermissionBlocked(): Promise<boolean> {
  const permission = getStoragePermission();
  if (!permission) return false;
  const result = await check(permission);
  return result === RESULTS.BLOCKED;
}

export function openAppSettings(): void {
  Linking.openSettings();
}

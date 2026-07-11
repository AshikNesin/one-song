import { Buffer } from 'buffer';
import * as RNFS from 'react-native-fs';
import {
  parseId3Metadata,
  parseMp4Metadata,
} from '@/utils/metadata';

interface SongMetadata {
  title?: string;
  artist?: string;
  artwork?: string;
}

function filePathFromUri(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

async function fetchFileBytes(uri: string, limitBytes?: number): Promise<Uint8Array> {
  const path = filePathFromUri(uri);
  if (limitBytes !== undefined) {
    const base64 = await RNFS.read(path, limitBytes, 0, 'base64');
    return Buffer.from(base64, 'base64');
  }
  const base64 = await RNFS.readFile(path, 'base64');
  return Buffer.from(base64, 'base64');
}

async function writeArtworkToCache(artwork: { mime: string; base64: string }): Promise<string> {
  return `data:${artwork.mime};base64,${artwork.base64}`;
}

async function tryId3(fileUri: string): Promise<SongMetadata | null> {
  const CHUNK_SIZE = 256 * 1024;
  const bytes = await fetchFileBytes(fileUri, CHUNK_SIZE);
  const metadata = parseId3Metadata(bytes);

  if (!metadata.title && !metadata.artist && !metadata.artwork) {
    return null;
  }

  const result: SongMetadata = {};
  if (metadata.title) result.title = metadata.title;
  if (metadata.artist) result.artist = metadata.artist;
  if (metadata.artwork) {
    result.artwork = await writeArtworkToCache(metadata.artwork);
  }
  return result;
}

async function tryMp4(fileUri: string): Promise<SongMetadata | null> {
  const bytes = await fetchFileBytes(fileUri);
  const metadata = parseMp4Metadata(bytes);

  if (!metadata.title && !metadata.artist && !metadata.artwork) {
    return null;
  }

  const result: SongMetadata = {};
  if (metadata.title) result.title = metadata.title;
  if (metadata.artist) result.artist = metadata.artist;
  if (metadata.artwork) {
    result.artwork = await writeArtworkToCache(metadata.artwork);
  }
  return result;
}

export async function extractMetadata(fileUri: string): Promise<SongMetadata> {
  try {
    const id3Result = await tryId3(fileUri);
    if (id3Result) return id3Result;
  } catch {
    // ID3 parsing failed, will try MP4
  }

  try {
    const mp4Result = await tryMp4(fileUri);
    if (mp4Result) return mp4Result;
  } catch {
    // MP4 parsing failed
  }

  return {};
}

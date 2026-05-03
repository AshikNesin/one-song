import { read, readFile, writeFile, CachesDirectoryPath } from 'react-native-fs';
import { Buffer } from 'buffer';
import {
  parseId3Metadata,
  parseMp4Metadata,
  getImageExtension,
} from '@/utils/metadata';

interface SongMetadata {
  title?: string;
  artist?: string;
  artwork?: string;
}

async function writeArtworkToCache(artwork: { mime: string; base64: string }): Promise<string> {
  const ext = getImageExtension(artwork.mime);
  const artworkFileName = `artwork-${Date.now()}.${ext}`;
  const artworkPath = `${CachesDirectoryPath}/${artworkFileName}`;
  await writeFile(artworkPath, artwork.base64, 'base64');
  return `file://${artworkPath}`;
}

async function tryId3(filePath: string): Promise<SongMetadata | null> {
  const CHUNK_SIZE = 256 * 1024;
  const base64Data = await read(filePath, CHUNK_SIZE, 0, 'base64');
  const buffer = Buffer.from(base64Data, 'base64');
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
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

async function tryMp4(filePath: string): Promise<SongMetadata | null> {
  const base64Data = await readFile(filePath, 'base64');
  const buffer = Buffer.from(base64Data, 'base64');
  const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const metadata = parseMp4Metadata(data);

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

export async function extractMetadata(filePath: string): Promise<SongMetadata> {
  try {
    const id3Result = await tryId3(filePath);
    if (id3Result) return id3Result;
  } catch {
    // ID3 parsing failed, will try MP4
  }

  try {
    const mp4Result = await tryMp4(filePath);
    if (mp4Result) return mp4Result;
  } catch {
    // MP4 parsing failed
  }

  return {};
}

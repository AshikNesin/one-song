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

function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

async function fetchFileBytes(uri: string, limitBytes?: number): Promise<Uint8Array> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  const blob = await response.blob();
  const slice = limitBytes !== undefined ? blob.slice(0, limitBytes) : blob;
  const arrayBuffer = await readBlobAsArrayBuffer(slice);
  return new Uint8Array(arrayBuffer);
}

async function writeArtworkToCache(artwork: { mime: string; base64: string }): Promise<string> {
  const ext = getImageExtension(artwork.mime);
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

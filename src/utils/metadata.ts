import { read } from 'react-native-fs';
import parse from 'id3-parser';

export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  artwork?: string;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function formatArtwork(mime: string, data: ArrayLike<number>): string {
  const bytes = Array.from(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mime};base64,${base64}`;
}

export async function extractMetadata(
  filePath: string,
): Promise<ExtractedMetadata> {
  const cleanPath = filePath.replace(/^file:\/\//, '');

  try {
    const base64Data = await read(cleanPath, 0, 0, 'base64');
    const buffer = base64ToUint8Array(base64Data);
    const tag = parse(buffer);

    const metadata: ExtractedMetadata = {};

    if (tag?.title) {
      metadata.title = String(tag.title);
    }
    if (tag?.artist) {
      metadata.artist = String(tag.artist);
    }
    if (tag?.image?.data && tag.image.mime) {
      metadata.artwork = formatArtwork(tag.image.mime, tag.image.data);
    }

    return metadata;
  } catch {
    return {};
  }
}

export function parseFilename(filename: string): {
  title?: string;
  artist?: string;
} {
  if (!filename) {
    return {};
  }

  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  if (!nameWithoutExt) {
    return {};
  }

  const match = nameWithoutExt.match(/^(.+?)\s*-\s*(.+)$/);
  if (match) {
    return {
      artist: match[1].trim(),
      title: match[2].trim(),
    };
  }

  return { title: nameWithoutExt };
}

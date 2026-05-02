import jsmediatags from 'jsmediatags';

declare function btoa(data: string): string;

export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  artwork?: string;
}

function formatArtwork(picture: {
  format: string;
  data: number[] | Uint8Array | ArrayBuffer;
}): string {
  let bytes: number[];
  if (Array.isArray(picture.data)) {
    bytes = picture.data;
  } else if (picture.data instanceof Uint8Array) {
    bytes = Array.from(picture.data);
  } else if (picture.data instanceof ArrayBuffer) {
    bytes = Array.from(new Uint8Array(picture.data));
  } else {
    bytes = Array.from(picture.data as any);
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${picture.format};base64,${base64}`;
}

export async function extractMetadata(
  filePath: string,
): Promise<ExtractedMetadata> {
  const cleanPath = filePath.replace(/^file:\/\//, '');

  return new Promise(resolve => {
    jsmediatags.read(cleanPath, {
      onSuccess: tag => {
        const tags = tag.tags;
        const metadata: ExtractedMetadata = {};

        if (tags.title) {
          metadata.title = String(tags.title);
        }
        if (tags.artist) {
          metadata.artist = String(tags.artist);
        }
        if (tags.picture) {
          metadata.artwork = formatArtwork(tags.picture);
        }

        resolve(metadata);
      },
      onError: () => {
        resolve({});
      },
    });
  });
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

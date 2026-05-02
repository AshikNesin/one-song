import { Buffer } from 'buffer';
import parse from 'id3-parser';

export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  artwork?: { mime: string; base64: string };
}

export function getImageExtension(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  };
  return map[mime.toLowerCase()] || 'jpg';
}

function readUInt32BE(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  return view.getUint32(0, false);
}

function readString(data: Uint8Array, offset: number, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(data[offset + i]);
  }
  return result;
}

interface Atom {
  type: string;
  data: Uint8Array;
}

function parseAtoms(data: Uint8Array, headerSkip: number = 0): Atom[] {
  const atoms: Atom[] = [];
  let offset = headerSkip;

  while (offset + 8 <= data.length) {
    const size = readUInt32BE(data, offset);
    if (size === 0) break;
    if (size < 8 || offset + size > data.length) break;

    const type = readString(data, offset + 4, 4);
    const atomData = data.slice(offset + 8, offset + size);

    atoms.push({ type, data: atomData });
    offset += size;
  }

  return atoms;
}

function findAtom(atoms: Atom[], type: string): Atom | undefined {
  return atoms.find(a => a.type === type);
}

function decodeMp4Text(data: Uint8Array, typeByte: number): string {
  const valueData = data.slice(8); // skip 4 bytes version/flags + 4 bytes reserved
  if (typeByte === 0x01) {
    // UTF-16
    const buf = Buffer.from(valueData);
    if (valueData.length >= 2 && valueData[0] === 0xFE && valueData[1] === 0xFF) {
      // Big-endian BOM
      buf.swap16();
      return buf.toString('utf16le', 2);
    } else if (valueData.length >= 2 && valueData[0] === 0xFF && valueData[1] === 0xFE) {
      // Little-endian BOM
      return buf.toString('utf16le', 2);
    } else {
      // No BOM, assume big-endian
      buf.swap16();
      return buf.toString('utf16le');
    }
  }
  // UTF-8 (default)
  return Buffer.from(valueData).toString('utf8').replace(/\0/g, '');
}

function getMp4ImageMimeType(typeByte: number): string {
  switch (typeByte) {
    case 0x0D: return 'image/jpeg';
    case 0x0E: return 'image/png';
    case 0x0F: return 'image/bmp';
    case 0x10: return 'image/gif';
    default: return 'image/jpeg';
  }
}

export function parseMp4Metadata(data: Uint8Array): ExtractedMetadata {
  const fileAtoms = parseAtoms(data);
  const moov = findAtom(fileAtoms, 'moov');
  if (!moov) return {};

  const moovAtoms = parseAtoms(moov.data);
  const udta = findAtom(moovAtoms, 'udta');
  if (!udta) return {};

  const udtaAtoms = parseAtoms(udta.data);
  const meta = findAtom(udtaAtoms, 'meta');
  if (!meta) return {};

  const metaAtoms = parseAtoms(meta.data, 4);
  const ilst = findAtom(metaAtoms, 'ilst');
  if (!ilst) return {};

  const ilstAtoms = parseAtoms(ilst.data);
  const metadata: ExtractedMetadata = {};

  const nam = findAtom(ilstAtoms, '\u00A9nam');
  if (nam) {
    const dataAtom = findAtom(parseAtoms(nam.data), 'data');
    if (dataAtom) {
      const typeByte = dataAtom.data[0];
      metadata.title = decodeMp4Text(dataAtom.data, typeByte);
    }
  }

  const art = findAtom(ilstAtoms, '\u00A9ART');
  if (art) {
    const dataAtom = findAtom(parseAtoms(art.data), 'data');
    if (dataAtom) {
      const typeByte = dataAtom.data[0];
      metadata.artist = decodeMp4Text(dataAtom.data, typeByte);
    }
  }

  const covr = findAtom(ilstAtoms, 'covr');
  if (covr) {
    const dataAtom = findAtom(parseAtoms(covr.data), 'data');
    if (dataAtom) {
      const typeByte = dataAtom.data[0];
      const mime = getMp4ImageMimeType(typeByte);
      const imageData = dataAtom.data.slice(8);
      const imageBase64 = Buffer.from(imageData).toString('base64');
      metadata.artwork = { mime, base64: imageBase64 };
    }
  }

  return metadata;
}

export function parseId3Metadata(bytes: Uint8Array): ExtractedMetadata {
  const tag = parse(bytes);
  const metadata: ExtractedMetadata = {};

  if (tag?.title) {
    metadata.title = String(tag.title);
  }
  if (tag?.artist) {
    metadata.artist = String(tag.artist);
  }

  if (tag?.image?.data && tag.image.mime) {
    const imageBytes = Array.from(tag.image.data);
    const imageBase64 = Buffer.from(imageBytes).toString('base64');
    metadata.artwork = { mime: tag.image.mime, base64: imageBase64 };
  }

  return metadata;
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

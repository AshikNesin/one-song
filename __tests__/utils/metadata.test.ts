import {
  getImageExtension,
  parseFilename,
  parseMp4Metadata,
  parseId3Metadata,
} from '@/utils/metadata';

jest.mock('id3-parser', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import parse from 'id3-parser';

function uint8(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function strBytes(str: string): number[] {
  return Array.from(str).map(c => c.charCodeAt(0));
}

function makeAtom(type: string, data: Uint8Array | number[]): Uint8Array {
  const content = data instanceof Uint8Array ? data : uint8(...data);
  const size = 8 + content.length;
  const result = new Uint8Array(size);
  const view = new DataView(result.buffer);
  view.setUint32(0, size, false);
  for (let i = 0; i < 4; i++) {
    result[4 + i] = type.charCodeAt(i);
  }
  result.set(content, 8);
  return result;
}

function makeMp4MetaAtom(title: string, artist: string): Uint8Array {
  const titleAtom = makeAtom('\u00A9nam', makeAtom('data', [
    0x00, 0x00, 0x00, 0x01, // version/flags + type byte
    0x00, 0x00, 0x00, 0x00, // reserved
    ...strBytes(title),
  ]));
  const artistAtom = makeAtom('\u00A9ART', makeAtom('data', [
    0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00,
    ...strBytes(artist),
  ]));
  const ilst = makeAtom('ilst', new Uint8Array([...titleAtom, ...artistAtom]));
  const meta = makeAtom('meta', new Uint8Array([0x00, 0x00, 0x00, 0x00, ...ilst]));
  const udta = makeAtom('udta', meta);
  const moov = makeAtom('moov', udta);
  // Return moov directly as the top-level atom structure
  return moov;
}

describe('getImageExtension', () => {
  it('maps known mime types', () => {
    expect(getImageExtension('image/jpeg')).toBe('jpg');
    expect(getImageExtension('image/jpg')).toBe('jpg');
    expect(getImageExtension('image/png')).toBe('png');
    expect(getImageExtension('image/gif')).toBe('gif');
    expect(getImageExtension('image/webp')).toBe('webp');
    expect(getImageExtension('image/bmp')).toBe('bmp');
  });

  it('defaults to jpg for unknown mime types', () => {
    expect(getImageExtension('image/tiff')).toBe('jpg');
    expect(getImageExtension('application/octet-stream')).toBe('jpg');
  });

  it('is case-insensitive', () => {
    expect(getImageExtension('IMAGE/JPEG')).toBe('jpg');
    expect(getImageExtension('Image/Png')).toBe('png');
  });
});

describe('parseFilename', () => {
  it('extracts artist and title from "Artist - Title" format', () => {
    expect(parseFilename('The Beatles - Yesterday.mp3')).toEqual({
      artist: 'The Beatles',
      title: 'Yesterday',
    });
  });

  it('handles extra whitespace', () => {
    expect(parseFilename('Artist  -  Title.flac')).toEqual({
      artist: 'Artist',
      title: 'Title',
    });
  });

  it('returns only title when no dash separator', () => {
    expect(parseFilename('SongName.m4a')).toEqual({
      title: 'SongName',
    });
  });

  it('returns empty object for empty string', () => {
    expect(parseFilename('')).toEqual({});
  });

  it('returns empty object for extension-only filename', () => {
    expect(parseFilename('.mp3')).toEqual({});
  });
});

describe('parseMp4Metadata', () => {
  it('returns empty object for non-MP4 data', () => {
    expect(parseMp4Metadata(uint8(0, 0, 0, 0))).toEqual({});
  });

  it('extracts title and artist from moov/udta/meta/ilst atoms', () => {
    const data = makeMp4MetaAtom('Test Song', 'Test Artist');
    const result = parseMp4Metadata(data);
    expect(result.title).toBe('Test Song');
    expect(result.artist).toBe('Test Artist');
  });

  it('returns empty object when moov atom is missing', () => {
    const ftyp = makeAtom('ftyp', uint8(0x00));
    expect(parseMp4Metadata(ftyp)).toEqual({});
  });

  it('returns empty object when udta atom is missing', () => {
    const moov = makeAtom('moov', uint8(0x00));
    expect(parseMp4Metadata(moov)).toEqual({});
  });

  it('returns empty object when meta atom is missing', () => {
    const udta = makeAtom('udta', uint8(0x00));
    const moov = makeAtom('moov', udta);
    expect(parseMp4Metadata(moov)).toEqual({});
  });

  it('extracts artwork from covr atom', () => {
    const imageBytes = [0xFF, 0xD8, 0xFF, 0xE0]; // JPEG header
    const covr = makeAtom('covr', makeAtom('data', [
      0x00, 0x00, 0x00, 0x0D, // type byte for JPEG
      0x00, 0x00, 0x00, 0x00, // reserved
      ...imageBytes,
    ]));
    const ilst = makeAtom('ilst', covr);
    const meta = makeAtom('meta', new Uint8Array([0x00, 0x00, 0x00, 0x00, ...ilst]));
    const udta = makeAtom('udta', meta);
    const moov = makeAtom('moov', udta);

    const result = parseMp4Metadata(moov);
    expect(result.artwork).toBeDefined();
    expect(result.artwork?.mime).toBe('image/jpeg');
    expect(result.artwork?.base64).toBe(Buffer.from(imageBytes).toString('base64'));
  });
});

describe('parseId3Metadata', () => {
  it('returns empty object when parser returns null', () => {
    (parse as jest.Mock).mockReturnValue(null);
    expect(parseId3Metadata(uint8(0x49, 0x44, 0x33))).toEqual({});
  });

  it('extracts title and artist from ID3 tag', () => {
    (parse as jest.Mock).mockReturnValue({
      title: 'ID3 Title',
      artist: 'ID3 Artist',
    });
    const result = parseId3Metadata(uint8(0x00));
    expect(result.title).toBe('ID3 Title');
    expect(result.artist).toBe('ID3 Artist');
  });

  it('extracts artwork from ID3 tag', () => {
    const imageData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
    (parse as jest.Mock).mockReturnValue({
      title: 'Song',
      image: {
        mime: 'image/png',
        data: imageData,
      },
    });
    const result = parseId3Metadata(uint8(0x00));
    expect(result.artwork?.mime).toBe('image/png');
    expect(result.artwork?.base64).toBe(Buffer.from(imageData).toString('base64'));
  });

  it('handles missing optional fields', () => {
    (parse as jest.Mock).mockReturnValue({
      title: 'Only Title',
    });
    const result = parseId3Metadata(uint8(0x00));
    expect(result.title).toBe('Only Title');
    expect(result.artist).toBeUndefined();
    expect(result.artwork).toBeUndefined();
  });
});

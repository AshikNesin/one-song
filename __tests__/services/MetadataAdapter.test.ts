import { extractMetadata } from '@/services/MetadataAdapter';

jest.mock('@/utils/metadata', () => ({
  parseId3Metadata: jest.fn(),
  parseMp4Metadata: jest.fn(),
  getImageExtension: jest.fn().mockReturnValue('jpg'),
}));

import {
  parseId3Metadata,
  parseMp4Metadata,
} from '@/utils/metadata';

// Mock fetch and FileReader for blob/arrayBuffer testing
global.fetch = jest.fn();

function setupMockFileReader() {
  (global as any).FileReader = jest.fn().mockImplementation(() => {
    const reader = {
      onload: null as ((event: { target: { result: ArrayBuffer } }) => void) | null,
      onerror: null as ((event: any) => void) | null,
      readAsArrayBuffer: jest.fn().mockImplementation((_blob: Blob) => {
        // Synchronously trigger onload with an empty ArrayBuffer
        if (reader.onload) {
          reader.onload({ target: { result: new ArrayBuffer(0) } } as any);
        }
      }),
    };
    return reader;
  });
}

describe('MetadataAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockFileReader();
  });

  describe('extractMetadata', () => {
    it('returns ID3 metadata when ID3 parsing succeeds', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({
          slice: jest.fn().mockReturnValue({}),
        }),
      });
      (parseId3Metadata as jest.Mock).mockReturnValue({
        title: 'ID3 Song',
        artist: 'ID3 Artist',
      });

      const result = await extractMetadata('file:///path/to/song.mp3');

      expect(result.title).toBe('ID3 Song');
      expect(result.artist).toBe('ID3 Artist');
      expect(global.fetch).toHaveBeenCalledWith('file:///path/to/song.mp3');
    });

    it('returns ID3 metadata with artwork as data URI when present', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({
          slice: jest.fn().mockReturnValue({}),
        }),
      });
      (parseId3Metadata as jest.Mock).mockReturnValue({
        title: 'Song',
        artist: 'Artist',
        artwork: { mime: 'image/jpeg', base64: 'abc123' },
      });

      const result = await extractMetadata('file:///path/to/song.mp3');

      expect(result.title).toBe('Song');
      expect(result.artist).toBe('Artist');
      expect(result.artwork).toBe('data:image/jpeg;base64,abc123');
    });

    it('falls back to MP4 when ID3 returns empty metadata', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({
          slice: jest.fn().mockReturnValue({}),
        }),
      });
      (parseId3Metadata as jest.Mock).mockReturnValue({});
      (parseMp4Metadata as jest.Mock).mockReturnValue({
        title: 'MP4 Song',
        artist: 'MP4 Artist',
      });

      const result = await extractMetadata('file:///path/to/song.m4a');

      expect(result.title).toBe('MP4 Song');
      expect(result.artist).toBe('MP4 Artist');
      expect(global.fetch).toHaveBeenCalledWith('file:///path/to/song.m4a');
    });

    it('falls back to MP4 when ID3 parsing throws', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({
          slice: jest.fn().mockReturnValue({}),
        }),
      });
      (parseId3Metadata as jest.Mock).mockImplementation(() => {
        throw new Error('ID3 parse error');
      });
      (parseMp4Metadata as jest.Mock).mockReturnValue({
        title: 'Fallback Song',
      });

      const result = await extractMetadata('file:///path/to/song.mp3');

      expect(result.title).toBe('Fallback Song');
    });

    it('returns empty object when both parsers fail', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({
          slice: jest.fn().mockReturnValue({}),
        }),
      });
      (parseId3Metadata as jest.Mock).mockImplementation(() => {
        throw new Error('ID3 error');
      });
      (parseMp4Metadata as jest.Mock).mockImplementation(() => {
        throw new Error('MP4 error');
      });

      const result = await extractMetadata('file:///path/to/unknown.bin');

      expect(result).toEqual({});
    });

    it('returns empty object when both parsers return empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({
          slice: jest.fn().mockReturnValue({}),
        }),
      });
      (parseId3Metadata as jest.Mock).mockReturnValue({});
      (parseMp4Metadata as jest.Mock).mockReturnValue({});

      const result = await extractMetadata('file:///path/to/empty.mp3');

      expect(result).toEqual({});
    });

    it('returns MP4 metadata with artwork as data URI', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({
          slice: jest.fn().mockReturnValue({}),
        }),
      });
      (parseId3Metadata as jest.Mock).mockReturnValue({});
      (parseMp4Metadata as jest.Mock).mockReturnValue({
        title: 'MP4 With Art',
        artwork: { mime: 'image/png', base64: 'pngdata' },
      });

      const result = await extractMetadata('file:///path/to/song.m4a');

      expect(result.title).toBe('MP4 With Art');
      expect(result.artwork).toBe('data:image/png;base64,pngdata');
    });
  });
});

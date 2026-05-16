import { read, readFile, writeFile, CachesDirectoryPath } from 'react-native-fs';
import { extractMetadata } from '@/services/MetadataAdapter';

jest.mock('react-native-fs', () => ({
  read: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined),
  CachesDirectoryPath: '/mock/cache',
}));

jest.mock('@/utils/metadata', () => ({
  parseId3Metadata: jest.fn(),
  parseMp4Metadata: jest.fn(),
  getImageExtension: jest.fn().mockReturnValue('jpg'),
}));

import {
  parseId3Metadata,
  parseMp4Metadata,
} from '@/utils/metadata';

describe('MetadataAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractMetadata', () => {
    it('returns ID3 metadata when ID3 parsing succeeds', async () => {
      (parseId3Metadata as jest.Mock).mockReturnValue({
        title: 'ID3 Song',
        artist: 'ID3 Artist',
      });
      (read as jest.Mock).mockResolvedValue('base64chunk');

      const result = await extractMetadata('/path/to/song.mp3');

      expect(result.title).toBe('ID3 Song');
      expect(result.artist).toBe('ID3 Artist');
      expect(read).toHaveBeenCalledWith('/path/to/song.mp3', 256 * 1024, 0, 'base64');
      expect(readFile).not.toHaveBeenCalled();
    });

    it('returns ID3 metadata with artwork when present', async () => {
      (parseId3Metadata as jest.Mock).mockReturnValue({
        title: 'Song',
        artist: 'Artist',
        artwork: { mime: 'image/jpeg', base64: 'abc123' },
      });
      (read as jest.Mock).mockResolvedValue('base64chunk');

      const result = await extractMetadata('/path/to/song.mp3');

      expect(result.title).toBe('Song');
      expect(result.artist).toBe('Artist');
      expect(result.artwork).toMatch(/^file:\/\/\/mock\/cache\/artwork-\d+\.jpg$/);
      expect(writeFile).toHaveBeenCalled();
    });

    it('falls back to MP4 when ID3 returns empty metadata', async () => {
      (parseId3Metadata as jest.Mock).mockReturnValue({});
      (parseMp4Metadata as jest.Mock).mockReturnValue({
        title: 'MP4 Song',
        artist: 'MP4 Artist',
      });
      (read as jest.Mock).mockResolvedValue('base64chunk');
      (readFile as jest.Mock).mockResolvedValue('base64file');

      const result = await extractMetadata('/path/to/song.m4a');

      expect(result.title).toBe('MP4 Song');
      expect(result.artist).toBe('MP4 Artist');
      expect(read).toHaveBeenCalled();
      expect(readFile).toHaveBeenCalledWith('/path/to/song.m4a', 'base64');
    });

    it('falls back to MP4 when ID3 parsing throws', async () => {
      (parseId3Metadata as jest.Mock).mockImplementation(() => {
        throw new Error('ID3 parse error');
      });
      (parseMp4Metadata as jest.Mock).mockReturnValue({
        title: 'Fallback Song',
      });
      (read as jest.Mock).mockResolvedValue('base64chunk');
      (readFile as jest.Mock).mockResolvedValue('base64file');

      const result = await extractMetadata('/path/to/song.mp3');

      expect(result.title).toBe('Fallback Song');
    });

    it('returns empty object when both parsers fail', async () => {
      (parseId3Metadata as jest.Mock).mockImplementation(() => {
        throw new Error('ID3 error');
      });
      (parseMp4Metadata as jest.Mock).mockImplementation(() => {
        throw new Error('MP4 error');
      });
      (read as jest.Mock).mockResolvedValue('base64chunk');
      (readFile as jest.Mock).mockResolvedValue('base64file');

      const result = await extractMetadata('/path/to/unknown.bin');

      expect(result).toEqual({});
    });

    it('returns empty object when both parsers return empty', async () => {
      (parseId3Metadata as jest.Mock).mockReturnValue({});
      (parseMp4Metadata as jest.Mock).mockReturnValue({});
      (read as jest.Mock).mockResolvedValue('base64chunk');
      (readFile as jest.Mock).mockResolvedValue('base64file');

      const result = await extractMetadata('/path/to/empty.mp3');

      expect(result).toEqual({});
    });

    it('returns MP4 metadata with artwork', async () => {
      (parseId3Metadata as jest.Mock).mockReturnValue({});
      (parseMp4Metadata as jest.Mock).mockReturnValue({
        title: 'MP4 With Art',
        artwork: { mime: 'image/png', base64: 'pngdata' },
      });
      (read as jest.Mock).mockResolvedValue('base64chunk');
      (readFile as jest.Mock).mockResolvedValue('base64file');

      const result = await extractMetadata('/path/to/song.m4a');

      expect(result.title).toBe('MP4 With Art');
      expect(result.artwork).toMatch(/^file:\/\/\/mock\/cache\/artwork-\d+\.jpg$/);
    });
  });
});

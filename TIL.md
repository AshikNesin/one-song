# TIL: Metadata Extraction in React Native

## `react-native-fs.read()` length defaults to 0, not "read all"

`read(filepath, length, position, encoding)` — if `length` is `0`, it reads **zero bytes**. You must explicitly pass a chunk size (e.g. `256 * 1024`).

## `atob`/`btoa` don't exist in React Native

Hermes/JavaScriptCore doesn't provide `atob`/`btoa`. Use the `buffer` package (`Buffer.from(data, 'base64')`) instead.

## ID3 tags are MP3-only

`id3-parser` only reads ID3 tags. M4A/MP4 files store metadata in **MP4 atoms**, not ID3 tags. You need a separate parser for MP4.

## MP4 atom hierarchy for metadata

Metadata lives inside: `moov` → `udta` → `meta` → `ilst`

- `meta` is a "full box" — it has a 4-byte version/flags header **before** its children
- `udta` is a regular container — **no** header skip before its children

## MP4 `data` atom type indicator is the first byte

The `data` atom's first byte indicates encoding/format:
- `0x01` = UTF-8 text
- `0x0D` = JPEG image
- `0x0E` = PNG image

Read it as `data[0]`, not as a big-endian uint32 (`readUInt32BE` gives `0x01000000`).

## Artwork as `file://` path > base64 data URI

Both React Native `<Image>` and `react-native-track-player` support `file://` URIs. Saving extracted artwork to the cache directory as a file and storing the path is more reliable than base64 data URIs (no AsyncStorage bloat, no encoding overhead).

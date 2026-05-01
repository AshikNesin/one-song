import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { Song } from '../types';
import { requestStoragePermission } from '../services/PermissionService';
import { saveSong, setOnboardingComplete } from '../services/StorageService';

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePickSong = async () => {
    setError(null);
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      setError('Storage permission is required to select a song.');
      return;
    }

    try {
      const result = await pick({
        type: ['audio/*'],
      });

      if (result.length === 0) return;

      const file = result[0];

      const localCopy = await keepLocalCopy({
        files: [{ uri: file.uri, fileName: file.name ?? 'song.mp3' }],
        destination: 'cachesDirectory',
      });

      if (localCopy[0].status === 'error') {
        setError('Failed to copy file locally. Please try again.');
        return;
      }

      const song: Song = {
        id: localCopy[0].localUri,
        title: file.name ?? 'Unknown Song',
        artist: 'Unknown Artist',
        url: localCopy[0].localUri,
        duration: 0,
      };

      setSelectedSong(song);
    } catch (err) {
      setError('Failed to pick a file. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (!selectedSong) return;
    await saveSong(selectedSong);
    await setOnboardingComplete();
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>One Song</Text>
      <Text style={styles.subtitle}>Pick a single song to play on repeat.</Text>

      <Pressable style={styles.pickButton} onPress={handlePickSong}>
        <Text style={styles.pickButtonText}>
          {selectedSong ? 'Change Song' : 'Select Song'}
        </Text>
      </Pressable>

      {selectedSong && (
        <Text style={styles.songName} numberOfLines={1}>
          {selectedSong.title}
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {selectedSong && (
        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  pickButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginBottom: 16,
  },
  pickButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  songName: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 24,
    maxWidth: '80%',
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

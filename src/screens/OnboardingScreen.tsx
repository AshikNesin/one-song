import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Song } from '../types';
import { pickSong, completeOnboarding, openAppSettings } from '../services/OnboardingFlow';

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePickSong = async () => {
    setError(null);
    const result = await pickSong();

    if ('type' in result) {
      if (result.type === 'permission_denied') {
        if (result.blocked) {
          Alert.alert(
            'Permission Required',
            'Storage permission is permanently denied. Please enable it in app settings to select a song.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openAppSettings },
            ],
          );
        } else {
          setError('Storage permission is required to select a song.');
        }
      } else if (result.type === 'copy_failed') {
        setError('Failed to copy file locally. Please try again.');
      } else {
        setError('Failed to pick a file. Please try again.');
      }
      return;
    }

    setSelectedSong(result.song);
  };

  const handleContinue = async () => {
    if (!selectedSong) return;
    await completeOnboarding(selectedSong);
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

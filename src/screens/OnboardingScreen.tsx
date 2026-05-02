import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Song } from '../types';
import { intake, complete, openAppSettings } from '../services/SongIntake';

export default function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const handlePickSong = async () => {
    setError(null);
    setIsPicking(true);
    const result = await intake();
    setIsPicking(false);

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

    setSelectedSong(result);
  };

  const handleContinue = async () => {
    if (!selectedSong) return;
    await complete(selectedSong);
    navigation.navigate('Player');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>One Song</Text>
      <Text style={styles.subtitle}>Pick a single song to play on repeat.</Text>

      <Pressable style={styles.pickButton} onPress={handlePickSong} disabled={isPicking}>
        <Text style={styles.pickButtonText}>
          {selectedSong ? 'Change Song' : 'Select Song'}
        </Text>
      </Pressable>

      {isPicking && (
        <ActivityIndicator style={styles.pickingIndicator} size="small" color="rgba(255,255,255,0.4)" />
      )}

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
  pickingIndicator: {
    marginBottom: 24,
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

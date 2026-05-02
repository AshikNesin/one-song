import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { usePlaybackController } from '../services/PlaybackController';
import ProgressBar from '../components/ProgressBar';
import PlayPauseButton from '../components/PlayPauseButton';
import SleepTimerButton from '../components/SleepTimerButton';

export default function PlayerScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isPlaying, position, duration, isReady, hasSong, song, initError, togglePlay, seek } =
    usePlaybackController();

  useEffect(() => {
    if (initError) {
      navigation.navigate('Onboarding');
    }
  }, [initError, navigation]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
      </View>
    );
  }

  if (!hasSong || !song) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No song found. Please reselect.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.artwork}>
        <Text style={styles.artworkIcon}>🎵</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {song.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {song.artist}
      </Text>

      <View style={styles.spacer} />

      <ProgressBar position={position} duration={duration} onSeek={seek} />

      <View style={styles.controls}>
        <PlayPauseButton isPlaying={isPlaying} onPress={togglePlay} />
      </View>

      <View style={styles.footer}>
        <SleepTimerButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  topSpacer: {
    flex: 1,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 22,
    color: '#999',
  },
  loadingContainer: {
    justifyContent: 'center',
  },
  error: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
  artwork: {
    width: 240,
    height: 240,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  artworkIcon: {
    fontSize: 80,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  artist: {
    color: '#999',
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  controls: {
    marginTop: 32,
    marginBottom: 24,
  },
  footer: {
    marginTop: 16,
  },
});

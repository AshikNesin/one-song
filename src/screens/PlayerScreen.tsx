import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { State } from 'react-native-track-player';
import { Song } from '../types';
import { getSong, getSleepTimer, saveSleepTimer, clearAll } from '../services/StorageService';
import {
  setupPlayer,
  loadSong,
  play,
  pause,
  getPlaybackState,
  setSleepTimer,
  clearSleepTimer,
  useAudioFocus,
  useRemotePlayPause,
} from '../services/AudioService';
import ProgressBar from '../components/ProgressBar';
import PlayPauseButton from '../components/PlayPauseButton';
import SleepTimerButton from '../components/SleepTimerButton';

export default function PlayerScreen() {
  const navigation = useNavigation();
  const [song, setSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await setupPlayer();

      const savedSong = await getSong();
      const savedTimer = await getSleepTimer();

      if (!mounted) return;

      setSong(savedSong);
      setTimerMinutes(savedTimer);

      if (savedSong) {
        try {
          await loadSong(savedSong);
          if (savedTimer) {
            setSleepTimer(savedTimer);
          }
          await play();
        } catch {
          await clearAll();
          setSong(null);
          setIsReady(true);
          // @ts-ignore
          navigation.navigate('Onboarding');
          return;
        }
      }

      const state = await getPlaybackState();
      setIsPlaying(state === State.Playing);
      setIsReady(true);
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const state = await getPlaybackState();
      setIsPlaying(state === State.Playing);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useAudioFocus(event => {
    if (event.type === 'focus_lost' && event.permanent) {
      setIsPlaying(false);
    } else if (event.type === 'focus_gained') {
      setIsPlaying(true);
    }
  });

  useRemotePlayPause(
    async () => {
      await play();
      setIsPlaying(true);
    },
    async () => {
      await pause();
      setIsPlaying(false);
    },
  );

  const togglePlay = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
    const state = await getPlaybackState();
    setIsPlaying(state === State.Playing);
  };

  const handleTimerChange = async (minutes: number | null) => {
    setTimerMinutes(minutes);
    await saveSleepTimer(minutes);
    clearSleepTimer();
    setSleepTimer(minutes);
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!song) {
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
          onPress={() => navigation.navigate('Settings' as never)}>
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

      <ProgressBar />

      <View style={styles.controls}>
        <PlayPauseButton isPlaying={isPlaying} onPress={togglePlay} />
      </View>

      <View style={styles.footer}>
        <SleepTimerButton currentMinutes={timerMinutes} onSelect={handleTimerChange} />
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
  loading: {
    color: '#fff',
    fontSize: 16,
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

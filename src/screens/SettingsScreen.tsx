import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSong, getSleepTimer, saveSleepTimer, clearAll, getAutoPlayEnabled, saveAutoPlayEnabled } from '../services/StorageService';
import { SLEEP_TIMER_PRESETS } from '../utils/constants';
import { clearSleepTimer } from '../services/AudioService';

interface Props {
  onChangeSong: () => void;
}

export default function SettingsScreen({ onChangeSong }: Props) {
  const navigation = useNavigation();
  const [defaultTimer, setDefaultTimer] = useState<number | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    getSleepTimer().then(setDefaultTimer);
    getSong().then(song => setCurrentSong(song?.title ?? null));
    getAutoPlayEnabled().then(setAutoPlay);
  }, []);

  const handleTimerSelect = async (minutes: number | null) => {
    setDefaultTimer(minutes);
    await saveSleepTimer(minutes);
    clearSleepTimer();
  };

  const handleAutoPlayToggle = async (enabled: boolean) => {
    setAutoPlay(enabled);
    await saveAutoPlayEnabled(enabled);
  };

  const handleChangeSong = () => {
    Alert.alert(
      'Change Song',
      'This will clear your current song and take you back to onboarding. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          style: 'destructive',
          onPress: onChangeSong,
        },
      ],
    );
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset Everything',
      'This will clear all app data including your selected song. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            clearSleepTimer();
            onChangeSong();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Song">
          {currentSong && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {currentSong}
              </Text>
            </View>
          )}
          <SettingRow label="Change Song" onPress={handleChangeSong} />
        </Section>

        <Section title="Playback">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Auto-play on launch</Text>
            <Switch
              value={autoPlay}
              onValueChange={handleAutoPlayToggle}
              trackColor={{ false: '#333', true: '#fff' }}
              thumbColor={autoPlay ? '#000' : '#ccc'}
            />
          </View>
        </Section>

        <Section title="Sleep Timer Default">
          <View style={styles.timerRow}>
            {SLEEP_TIMER_PRESETS.map(preset => (
              <Pressable
                key={preset.minutes}
                style={[
                  styles.timerChip,
                  defaultTimer === preset.minutes && styles.timerChipActive,
                ]}
                onPress={() => handleTimerSelect(preset.minutes)}>
                <Text
                  style={[
                    styles.timerChipText,
                    defaultTimer === preset.minutes && styles.timerChipTextActive,
                  ]}>
                  {preset.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.timerChip, defaultTimer === null && styles.timerChipActive]}
              onPress={() => handleTimerSelect(null)}>
              <Text
                style={[
                  styles.timerChipText,
                  defaultTimer === null && styles.timerChipTextActive,
                ]}>
                Off
              </Text>
            </Pressable>
          </View>
        </Section>

        <Section title="About">
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>One Song</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>0.0.1</Text>
          </View>
        </Section>

        <Section title="Feedback">
          <Pressable
            style={styles.row}
            onPress={() => Linking.openURL('mailto:hi@nesin.io')}>
            <Text style={styles.rowLabel}>Report a Bug or Share Feedback</Text>
            <Text style={styles.rowArrow}>›</Text>
          </Pressable>
        </Section>

        <Section title="Danger Zone">
          <Pressable style={styles.dangerRow} onPress={handleResetAll}>
            <Text style={styles.dangerText}>Reset All Data</Text>
          </Pressable>
        </Section>

        <Pressable onPress={() => Linking.openURL('https://nesin.io?ref=onesong')}>
          <Text style={styles.footer}>Built by Nesin Technologies LLP</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 32,
  },
  spacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
  },
  rowArrow: {
    color: '#666',
    fontSize: 20,
  },
  timerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  timerChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
  },
  timerChipActive: {
    backgroundColor: '#fff',
  },
  timerChipText: {
    color: '#ccc',
    fontSize: 14,
  },
  timerChipTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 16,
    marginRight: 16,
  },
  infoValue: {
    color: '#999',
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  aboutLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  aboutValue: {
    color: '#999',
    fontSize: 16,
  },
  dangerRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dangerText: {
    color: '#ff4444',
    fontSize: 16,
  },
  footer: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
});

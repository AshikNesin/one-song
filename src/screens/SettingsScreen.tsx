import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { useSettings } from '@/hooks/useSettings';
import TimerPresetPicker from '@/components/TimerPresetPicker';

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { state, actions } = useSettings();

  const handleChangeSong = () => {
    Alert.alert(
      'Change Song',
      'This will clear your current song and take you back to onboarding. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          style: 'destructive',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              }),
            ),
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
            await actions.clearAllData();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              }),
            );
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
          {state.currentSong && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {state.currentSong}
              </Text>
            </View>
          )}
          <SettingRow label="Change Song" onPress={handleChangeSong} />
        </Section>

        <Section title="Playback">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Auto-play on launch</Text>
            <Switch
              value={state.autoPlay}
              onValueChange={actions.toggleAutoPlay}
              trackColor={{ false: '#333', true: '#fff' }}
              thumbColor={state.autoPlay ? '#000' : '#ccc'}
            />
          </View>
        </Section>

        <Section title="Sleep Timer Default">
          <View style={styles.timerRow}>
            <TimerPresetPicker selectedMinutes={state.defaultTimerMinutes} onSelect={actions.setTimerPreset} />
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
          <Text style={styles.footer}>One Song v{require('../../package.json').version} · Built by Nesin Technologies LLP</Text>
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

import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SLEEP_TIMER_PRESETS } from '../utils/constants';
import { getDefaultSleepTimer, setDefaultSleepTimer, setSleepTimer, clearSleepTimer } from '../services/SleepTimer';

export default function SleepTimerButton() {
  const [visible, setVisible] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  React.useEffect(() => {
    getDefaultSleepTimer().then(setCurrentMinutes);
  }, []);

  const label = currentMinutes ? `Timer: ${currentMinutes}m` : 'Sleep Timer';

  const handleSelect = async (minutes: number | null) => {
    setCurrentMinutes(minutes);
    await setDefaultSleepTimer(minutes);
    clearSleepTimer();
    setSleepTimer(minutes);
    setVisible(false);
  };

  return (
    <>
      <Pressable style={styles.button} onPress={() => setVisible(true)}>
        <Text style={styles.text}>{label}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.content}>
            <Text style={styles.title}>Sleep Timer</Text>
            {SLEEP_TIMER_PRESETS.map(preset => (
              <Pressable
                key={preset.minutes}
                style={styles.option}
                onPress={() => handleSelect(preset.minutes)}>
                <Text style={[styles.optionText, currentMinutes === preset.minutes && styles.activeOption]}>
                  {preset.label}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.option} onPress={() => handleSelect(null)}>
              <Text style={styles.optionText}>Off</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionText: {
    color: '#ccc',
    fontSize: 16,
  },
  activeOption: {
    color: '#fff',
    fontWeight: '600',
  },
});

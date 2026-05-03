import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { loadDefaultTimer, saveDefaultTimer, setTimer, clearTimer } from '@/services/SleepTimer';
import TimerPresetPicker from './TimerPresetPicker';

export default function SleepTimerButton() {
  const [visible, setVisible] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    loadDefaultTimer().then(setCurrentMinutes);
  }, []);

  const label = currentMinutes ? `Timer: ${currentMinutes}m` : 'Sleep Timer';

  const handleSelect = async (minutes: number | null) => {
    setCurrentMinutes(minutes);
    await saveDefaultTimer(minutes);
    await clearTimer();
    await setTimer(minutes);
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
            <TimerPresetPicker selectedMinutes={currentMinutes} onSelect={handleSelect} />
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
});

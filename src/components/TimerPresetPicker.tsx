import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SLEEP_TIMER_PRESETS } from '@/utils/constants';

interface Props {
  selectedMinutes: number | null;
  onSelect: (minutes: number | null) => void;
}

export default function TimerPresetPicker({ selectedMinutes, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {SLEEP_TIMER_PRESETS.map(preset => (
        <Pressable
          key={preset.minutes}
          style={[styles.chip, selectedMinutes === preset.minutes && styles.chipActive]}
          onPress={() => onSelect(preset.minutes)}>
          <Text
            style={[
              styles.chipText,
              selectedMinutes === preset.minutes && styles.chipTextActive,
            ]}>
            {preset.label}
          </Text>
        </Pressable>
      ))}
      <Pressable
        style={[styles.chip, selectedMinutes === null && styles.chipActive]}
        onPress={() => onSelect(null)}>
        <Text
          style={[
            styles.chipText,
            selectedMinutes === null && styles.chipTextActive,
          ]}>
          Off
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
  },
  chipActive: {
    backgroundColor: '#fff',
  },
  chipText: {
    color: '#ccc',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '600',
  },
});

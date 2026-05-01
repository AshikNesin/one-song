import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface Props {
  isPlaying: boolean;
  onPress: () => void;
}

function PlayIcon() {
  return (
    <View style={playStyles.container}>
      <View style={playStyles.triangle} />
    </View>
  );
}

function PauseIcon() {
  return (
    <View style={pauseStyles.container}>
      <View style={pauseStyles.bar} />
      <View style={pauseStyles.bar} />
    </View>
  );
}

export default function PlayPauseButton({ isPlaying, onPress }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const playStyles = StyleSheet.create({
  container: {
    width: 28,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 24,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftColor: '#000',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
});

const pauseStyles = StyleSheet.create({
  container: {
    width: 28,
    height: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bar: {
    width: 8,
    height: 28,
    backgroundColor: '#000',
    borderRadius: 1,
  },
});

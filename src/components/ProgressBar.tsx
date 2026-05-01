import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, GestureResponderEvent } from 'react-native';
import { getProgress, seekTo } from '../services/AudioService';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface BarLayout {
  x: number;
  width: number;
}

export default function ProgressBar() {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const barLayout = useRef<BarLayout | null>(null);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const { position: pos, duration: dur } = await getProgress();
        if (active) {
          setPosition(pos);
          setDuration(dur);
        }
      } catch {
        // Player not ready yet
      }
    };
    const interval = setInterval(tick, 1000);
    tick();
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    barLayout.current = { x, width };
  }, []);

  const calculateSeekTime = (event: GestureResponderEvent): number => {
    const layout = barLayout.current;
    if (!layout || duration <= 0) return 0;

    const touchX = event.nativeEvent.pageX - layout.x;
    const ratio = Math.max(0, Math.min(1, touchX / layout.width));
    return ratio * duration;
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    setIsDragging(true);
    const time = calculateSeekTime(event);
    setDragPosition(time);
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    if (!isDragging) return;
    const time = calculateSeekTime(event);
    setDragPosition(time);
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    setIsDragging(false);
    const time = calculateSeekTime(event);
    seekTo(time);
    setPosition(time);
  };

  const currentProgress = isDragging ? dragPosition : position;
  const progressPercent = duration > 0 ? (currentProgress / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <View
        style={styles.barBackground}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={[styles.thumb, { left: `${progressPercent}%` }]} />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentProgress)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
  },
  barBackground: {
    height: 24,
    justifyContent: 'center',
    marginVertical: -10,
  },
  barTrack: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: -6,
    top: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#999',
    fontSize: 12,
  },
});

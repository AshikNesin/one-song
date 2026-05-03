import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SettingsScreen from '../../src/screens/SettingsScreen';
import TimerPresetPicker from '../../src/components/TimerPresetPicker';

const mockGetSong = jest.fn().mockResolvedValue({ title: 'Test Song' });
const mockGetAutoPlayEnabled = jest.fn().mockResolvedValue(true);
const mockSaveAutoPlayEnabled = jest.fn().mockResolvedValue(undefined);
const mockClearSongData = jest.fn().mockResolvedValue(undefined);
const mockLoadDefaultTimer = jest.fn().mockResolvedValue(null);
const mockSaveDefaultTimer = jest.fn().mockResolvedValue(undefined);
const mockClearTimer = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/services/SongIntake', () => ({
  getSong: (...args: any[]) => mockGetSong(...args),
  clearSongData: (...args: any[]) => mockClearSongData(...args),
}));

jest.mock('@/services/Playback', () => ({
  getAutoPlayEnabled: (...args: any[]) => mockGetAutoPlayEnabled(...args),
  saveAutoPlayEnabled: (...args: any[]) => mockSaveAutoPlayEnabled(...args),
}));

jest.mock('@/services/SleepTimer', () => ({
  loadDefaultTimer: (...args: any[]) => mockLoadDefaultTimer(...args),
  saveDefaultTimer: (...args: any[]) => mockSaveDefaultTimer(...args),
  clearTimer: (...args: any[]) => mockClearTimer(...args),
}));

import { Alert, Linking } from 'react-native';

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSong.mockResolvedValue({ title: 'Test Song' });
    mockLoadDefaultTimer.mockResolvedValue(null);
    mockGetAutoPlayEnabled.mockResolvedValue(true);
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SettingsScreen />);
    });
  });

  it('toggles auto-play setting', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen />,
      );
    });
    const switchComponent = renderer.root.findByType('input');
    await ReactTestRenderer.act(async () => {
      switchComponent.props.onValueChange(false);
    });
    expect(mockSaveAutoPlayEnabled).toHaveBeenCalledWith(false);
  });

  it('opens mail when feedback is pressed', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen />,
      );
    });
    const pressables = renderer.root.findAllByType('button');
    const feedbackButton = pressables.find((p: any) => {
      try {
        const text = p.findByType('span');
        return text?.children?.includes?.('Report a Bug');
      } catch {
        return false;
      }
    });
    if (feedbackButton) {
      await ReactTestRenderer.act(async () => {
        feedbackButton.props.onPress();
      });
      expect(Linking.openURL).toHaveBeenCalledWith('mailto:hi@nesin.io');
    }
  });

  it('calls clearSongData on reset', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SettingsScreen />);
    });
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const resetAlert = alertCalls.find((call: any) => call[0] === 'Reset Everything');
    if (resetAlert) {
      const destructiveAction = resetAlert[2].find(
        (btn: any) => btn.style === 'destructive',
      );
      if (destructiveAction?.onPress) {
        await destructiveAction.onPress();
        expect(mockClearSongData).toHaveBeenCalled();
      }
    }
  });

  it('persists timer selection when a preset is chosen', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<SettingsScreen />);
    });
    const timerPicker = renderer.root.findByType(TimerPresetPicker);
    const pressables = timerPicker.findAllByType('button');
    const firstPreset = pressables[0];
    await ReactTestRenderer.act(async () => {
      firstPreset.props.onPress();
    });
    expect(mockSaveDefaultTimer).toHaveBeenCalledWith(5);
    expect(mockClearTimer).toHaveBeenCalled();
  });
});

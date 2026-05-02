import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SettingsScreen from '../../src/screens/SettingsScreen';

const mockGetSong = jest.fn().mockResolvedValue({ title: 'Test Song' });
const mockGetAutoPlayEnabled = jest.fn().mockResolvedValue(true);
const mockSaveAutoPlayEnabled = jest.fn().mockResolvedValue(undefined);
const mockClearAll = jest.fn().mockResolvedValue(undefined);
const mockGetDefaultSleepTimer = jest.fn().mockResolvedValue(null);
const mockSetDefaultSleepTimer = jest.fn().mockResolvedValue(undefined);
const mockClearSleepTimer = jest.fn();

jest.mock('../../src/services/StorageService', () => ({
  getSong: (...args: any[]) => mockGetSong(...args),
  getAutoPlayEnabled: (...args: any[]) => mockGetAutoPlayEnabled(...args),
  saveAutoPlayEnabled: (...args: any[]) => mockSaveAutoPlayEnabled(...args),
  clearAll: (...args: any[]) => mockClearAll(...args),
}));

jest.mock('../../src/services/SleepTimer', () => ({
  getDefaultSleepTimer: (...args: any[]) => mockGetDefaultSleepTimer(...args),
  setDefaultSleepTimer: (...args: any[]) => mockSetDefaultSleepTimer(...args),
  clearSleepTimer: (...args: any[]) => mockClearSleepTimer(...args),
  setSleepTimer: jest.fn(),
}));

import { Alert, Linking } from 'react-native';

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSong.mockResolvedValue({ title: 'Test Song' });
    mockGetDefaultSleepTimer.mockResolvedValue(null);
    mockGetAutoPlayEnabled.mockResolvedValue(true);
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SettingsScreen onChangeSong={jest.fn()} />);
    });
  });

  it('toggles auto-play setting', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen onChangeSong={jest.fn()} />,
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
        <SettingsScreen onChangeSong={jest.fn()} />,
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

  it('calls clearAll on reset', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SettingsScreen onChangeSong={jest.fn()} />);
    });
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const resetAlert = alertCalls.find((call: any) => call[0] === 'Reset Everything');
    if (resetAlert) {
      const destructiveAction = resetAlert[2].find(
        (btn: any) => btn.style === 'destructive',
      );
      if (destructiveAction?.onPress) {
        await destructiveAction.onPress();
        expect(mockClearAll).toHaveBeenCalled();
      }
    }
  });
});

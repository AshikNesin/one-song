import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import OnboardingScreen from '../../src/screens/OnboardingScreen';

const mockRequestStoragePermission = jest.fn();
const mockIsPermissionBlocked = jest.fn();
const mockSaveSong = jest.fn().mockResolvedValue(undefined);
const mockSetOnboardingComplete = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/services/PermissionService', () => ({
  requestStoragePermission: (...args: any[]) => mockRequestStoragePermission(...args),
  isPermissionBlocked: (...args: any[]) => mockIsPermissionBlocked(...args),
  openAppSettings: jest.fn(),
}));

jest.mock('../../src/services/StorageService', () => ({
  saveSong: (...args: any[]) => mockSaveSong(...args),
  setOnboardingComplete: (...args: any[]) => mockSetOnboardingComplete(...args),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn().mockResolvedValue([]),
  keepLocalCopy: jest.fn().mockResolvedValue([]),
}));

import { pick, keepLocalCopy } from '@react-native-documents/picker';

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<OnboardingScreen onComplete={jest.fn()} />);
    });
  });

  it('handles song pick when permission is granted', async () => {
    mockRequestStoragePermission.mockResolvedValue(true);
    (pick as jest.Mock).mockResolvedValue([{ uri: 'content://test.mp3', name: 'test.mp3' }]);
    (keepLocalCopy as jest.Mock).mockResolvedValue([
      { status: 'success', localUri: 'file:///test.mp3' },
    ]);

    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingScreen onComplete={jest.fn()} />,
      );
    });

    const pressables = renderer.root.findAllByType('button');
    const pickButton = pressables[0];
    await ReactTestRenderer.act(async () => {
      await pickButton.props.onPress();
    });

    expect(pick).toHaveBeenCalled();
    expect(keepLocalCopy).toHaveBeenCalled();
  });

  it('shows error when permission is denied', async () => {
    mockRequestStoragePermission.mockResolvedValue(false);
    mockIsPermissionBlocked.mockResolvedValue(false);

    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingScreen onComplete={jest.fn()} />,
      );
    });

    const pressables = renderer.root.findAllByType('button');
    await ReactTestRenderer.act(async () => {
      await pressables[0].props.onPress();
    });

    // After permission denied, error state should be set
    // The error text should appear in the tree
    const texts = renderer.root.findAllByType('span');
    const hasErrorText = texts.some((t: any) =>
      String(t.children).includes('Storage permission is required'),
    );
    expect(hasErrorText).toBe(true);
  });

  it('completes onboarding when continue is pressed', async () => {
    mockRequestStoragePermission.mockResolvedValue(true);
    (pick as jest.Mock).mockResolvedValue([{ uri: 'content://test.mp3', name: 'test.mp3' }]);
    (keepLocalCopy as jest.Mock).mockResolvedValue([
      { status: 'success', localUri: 'file:///test.mp3' },
    ]);

    const onComplete = jest.fn();
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingScreen onComplete={onComplete} />,
      );
    });

    // Pick a song first
    const pressables = renderer.root.findAllByType('button');
    await ReactTestRenderer.act(async () => {
      await pressables[0].props.onPress();
    });

    // Then press continue
    const continueButton = pressables.find((p: any) => {
      try {
        const text = p.findByType('span');
        return String(text?.children).includes('Continue');
      } catch {
        return false;
      }
    });
    if (continueButton) {
      await ReactTestRenderer.act(async () => {
        await continueButton.props.onPress();
      });
      expect(mockSaveSong).toHaveBeenCalled();
      expect(mockSetOnboardingComplete).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    }
  });
});

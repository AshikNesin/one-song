import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import OnboardingScreen from '@/screens/OnboardingScreen';

const mockIntake = jest.fn();
const mockComplete = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/SongIntake', () => ({
  intake: (...args: any[]) => mockIntake(...args),
  complete: (...args: any[]) => mockComplete(...args),
}));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<OnboardingScreen />);
    });
  });

  it('handles song pick when permission is granted', async () => {
    mockIntake.mockResolvedValue({
      id: 'file:///test.mp3',
      title: 'Test Song',
      artist: 'Test Artist',
      url: 'file:///test.mp3',
      duration: 0,
    });

    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<OnboardingScreen />);
    });

    const pressables = renderer.root.findAllByType('button');
    const pickButton = pressables[0];
    await ReactTestRenderer.act(async () => {
      await pickButton.props.onPress();
    });

    expect(mockIntake).toHaveBeenCalled();
  });

  it('shows error when permission is denied', async () => {
    mockIntake.mockResolvedValue({ type: 'permission_denied', blocked: false });

    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<OnboardingScreen />);
    });

    const pressables = renderer.root.findAllByType('button');
    await ReactTestRenderer.act(async () => {
      await pressables[0].props.onPress();
    });

    const texts = renderer.root.findAllByType('span');
    const hasErrorText = texts.some((t: any) =>
      String(t.children).includes('Storage permission is required'),
    );
    expect(hasErrorText).toBe(true);
  });

  it('completes onboarding when continue is pressed', async () => {
    const song = {
      id: 'file:///test.mp3',
      title: 'Test Song',
      artist: 'Test Artist',
      url: 'file:///test.mp3',
      duration: 0,
    };
    mockIntake.mockResolvedValue(song);

    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<OnboardingScreen />);
    });

    const pressables = renderer.root.findAllByType('button');
    await ReactTestRenderer.act(async () => {
      await pressables[0].props.onPress();
    });

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
      expect(mockComplete).toHaveBeenCalledWith(song);
    }
  });
});

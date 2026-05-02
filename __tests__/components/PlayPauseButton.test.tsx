import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import PlayPauseButton from '@/components/PlayPauseButton';

describe('PlayPauseButton', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <PlayPauseButton isPlaying={false} onPress={jest.fn()} />,
      );
    });
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PlayPauseButton isPlaying={false} onPress={onPress} />,
      );
    });
    const pressable = renderer.root.findByType('button');
    await ReactTestRenderer.act(async () => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});

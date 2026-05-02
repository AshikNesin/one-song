import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SleepTimerButton from '../../src/components/SleepTimerButton';

describe('SleepTimerButton', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <SleepTimerButton currentMinutes={null} onSelect={jest.fn()} />,
      );
    });
  });

  it('opens modal when pressed', async () => {
    const onSelect = jest.fn();
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SleepTimerButton currentMinutes={null} onSelect={onSelect} />,
      );
    });
    const pressable = renderer.root.findAllByType('button')[0];
    await ReactTestRenderer.act(async () => {
      pressable.props.onPress();
    });
    const modal = renderer.root.findByProps({ transparent: true });
    expect(modal.props.visible).toBe(true);
  });

  it('calls onSelect with selected minutes', async () => {
    const onSelect = jest.fn();
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SleepTimerButton currentMinutes={null} onSelect={onSelect} />,
      );
    });
    // Open modal first
    const button = renderer.root.findAllByType('button')[0];
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    // Find and press a preset option (skip main button [0] and overlay [1])
    const options = renderer.root.findAllByType('button');
    await ReactTestRenderer.act(async () => {
      options[2].props.onPress();
    });
    expect(onSelect).toHaveBeenCalled();
  });

  it('calls onSelect with null for Off', async () => {
    const onSelect = jest.fn();
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SleepTimerButton currentMinutes={15} onSelect={onSelect} />,
      );
    });
    const button = renderer.root.findAllByType('button')[0];
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    const options = renderer.root.findAllByType('button');
    // Last option is "Off"
    await ReactTestRenderer.act(async () => {
      options[options.length - 1].props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});

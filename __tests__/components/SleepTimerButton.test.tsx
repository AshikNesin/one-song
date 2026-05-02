import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SleepTimerButton from '../../src/components/SleepTimerButton';

describe('SleepTimerButton', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SleepTimerButton />);
    });
  });

  it('opens modal when pressed', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<SleepTimerButton />);
    });
    const pressable = renderer.root.findAllByType('button')[0];
    await ReactTestRenderer.act(async () => {
      pressable.props.onPress();
    });
    const modal = renderer.root.findByProps({ transparent: true });
    expect(modal.props.visible).toBe(true);
  });

  it('selects a preset option', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<SleepTimerButton />);
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
    // Modal should close after selection
    const modal = renderer.root.findByProps({ transparent: true });
    expect(modal.props.visible).toBe(false);
  });

  it('selects Off option', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<SleepTimerButton />);
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
    // Modal should close after selection
    const modal = renderer.root.findByProps({ transparent: true });
    expect(modal.props.visible).toBe(false);
  });
});

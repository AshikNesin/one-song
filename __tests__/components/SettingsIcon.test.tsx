import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SettingsIcon from '@/components/SettingsIcon';

describe('SettingsIcon', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SettingsIcon />);
    });
  });

  it('renders with custom size and color', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SettingsIcon size={32} color="#fff" />);
    });
  });
});

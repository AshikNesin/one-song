import * as React from 'react';

export const SafeAreaProvider = (props: any) =>
  React.createElement('SafeAreaProvider', props);
export const SafeAreaView = (props: any) =>
  React.createElement('SafeAreaView', props);
export const useSafeAreaInsets = jest.fn().mockReturnValue({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
};

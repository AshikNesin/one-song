export const NativeModules = {};

export const Platform = {
  OS: 'android',
  Version: 33,
  select: jest.fn((obj: any) => obj.android),
};

export const Linking = {
  openURL: jest.fn().mockResolvedValue(undefined),
  openSettings: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
};

export const Alert = {
  alert: jest.fn(),
};

// Export string tags so JSX compiles directly to React.createElement('div', ...)
export const View = 'div' as any;
export const Text = 'span' as any;
export const Pressable = 'button' as any;
export const Modal = 'dialog' as any;
export const Switch = 'input' as any;
export const ScrollView = 'div' as any;
export const StatusBar = 'div' as any;
export const SafeAreaView = 'div' as any;

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const useColorScheme = jest.fn().mockReturnValue('dark');

export default {
  NativeModules,
  Platform,
  Linking,
  Alert,
  View,
  Text,
  Pressable,
  Modal,
  Switch,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
};

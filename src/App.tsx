import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from '@/navigation/AppNavigator';
import { inAppUpdateService } from '@/services/InAppUpdateService';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    inAppUpdateService.checkAndPromptUpdate();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

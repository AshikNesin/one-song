import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { hasCompletedOnboarding } from '../services/StorageService';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then(setOnboardingDone);
  }, []);

  if (onboardingDone === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={onboardingDone ? 'Player' : 'Onboarding'}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding">
          {({ navigation }) => (
            <OnboardingScreen
              onComplete={() => {
                setOnboardingDone(true);
                navigation.navigate('Player');
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="Settings">
          {({ navigation }) => (
            <SettingsScreen
              onChangeSong={() => {
                setOnboardingDone(false);
                navigation.navigate('Onboarding');
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

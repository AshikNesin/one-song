import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import PlayerScreen from '../screens/PlayerScreen';
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingDone ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={() => setOnboardingDone(true)} />}
          </Stack.Screen>
        ) : null}
        <Stack.Screen name="Player" component={PlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

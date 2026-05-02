import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { hasCompletedOnboarding } from '../services/StorageService';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

type OnboardingProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
type SettingsProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function OnboardingScreenWrapper({ navigation }: OnboardingProps) {
  return (
    <OnboardingScreen
      onComplete={() => {
        navigation.navigate('Player');
      }}
    />
  );
}

function SettingsScreenWrapper({ navigation }: SettingsProps) {
  return (
    <SettingsScreen
      onChangeSong={() => {
        navigation.navigate('Onboarding');
      }}
    />
  );
}

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
        <Stack.Screen name="Onboarding" component={OnboardingScreenWrapper} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="Settings" component={SettingsScreenWrapper} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

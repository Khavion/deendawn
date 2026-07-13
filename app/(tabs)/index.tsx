import { Redirect } from 'expo-router';
import React from 'react';

import { isOnboarded } from '@/src/features/onboarding/onboardingState';
import { TodayScreen } from '@/src/features/prayer-times/components/TodayScreen';
import { useSettings } from '@/src/features/settings/SettingsContext';

export default function TodayRoute() {
  const { store } = useSettings();
  if (!isOnboarded(store)) return <Redirect href="/onboarding" />;
  return <TodayScreen />;
}

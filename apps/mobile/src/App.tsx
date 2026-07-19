import React, { useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { i18n as I18nInstance } from 'i18next';

import { I18nProvider } from './i18n/I18nProvider';
import { initI18n } from './i18n/init-i18n';
import type { SupportedLocale } from './i18n/resolve-device-locale';
import { syncLayoutDirection } from './i18n/sync-layout-direction';
import HomeScreen from './screens/HomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { attachAuthStateListener } from './state/auth-store';
import { hydrateOnboardingStatus, markOnboardingSeen, useOnboardingStore } from './state/onboarding-store';

// Testable app factory (the runtime shell is index.js, which only registers
// this component) — mirrors the app.ts/server.ts split in apps/server.
export type RootStackParamList = {
  Home: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Completing or skipping onboarding marks the persisted flag; the store flip
// re-renders the gate below onto the navigator. Intentionally not awaited:
// the store flips optimistically and its write-failure path is fail-open, so
// the returned promise never rejects and carries nothing to wait for.
const handleOnboardingComplete = (): void => {
  markOnboardingSeen();
};

const App = (): React.JSX.Element | null => {
  const [i18nInstance, setI18nInstance] = useState<I18nInstance | null>(null);
  const onboarding = useOnboardingStore((state) => state.onboarding);

  useEffect(() => {
    let isMounted = true;
    // Attach before anything renders so cold-start session hydration
    // (INITIAL_SESSION from AsyncStorage) lands in the auth store; detached
    // in cleanup so remounts never leak listeners.
    const detachAuthListener = attachAuthStateListener();

    // First-launch gate hydration runs alongside i18n init; both async reads
    // resolve before anything renders (see the null gate below). Not awaited:
    // completion is observed through the store, and the promise never rejects
    // (fail-open inside the store).
    hydrateOnboardingStatus();

    initI18n().then((instance) => {
      // initI18n only ever resolves to a supported language, so narrowing by
      // check (not assertion) recovers the locale for the layout sync.
      const locale: SupportedLocale = instance.language === 'he' ? 'he' : 'en';
      syncLayoutDirection(locale);
      if (isMounted) {
        setI18nInstance(instance);
      }
    });

    return () => {
      isMounted = false;
      detachAuthListener();
    };
  }, []);

  if (i18nInstance === null || onboarding.status === 'hydrating') {
    // Blank gate until the i18n instance is ready (rendering earlier would
    // flash raw translation keys) AND the onboarding flag is hydrated
    // (deciding earlier would flash the wrong first screen).
    return null;
  }

  if (!onboarding.hasSeenOnboarding) {
    // Conditional render, not a navigator route: onboarding is a one-time
    // pre-app gate, so it never sits on the navigation stack (no back
    // gesture into it). Screen 2 (permission priming) slots into this flow
    // when it lands.
    return (
      <I18nProvider i18n={i18nInstance}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider i18n={i18nInstance}>
      <NavigationContainer>
        {/* Header hidden: the navigator's screen name is a route id, not
            user-facing copy. */}
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Home" component={HomeScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    </I18nProvider>
  );
};

export default App;

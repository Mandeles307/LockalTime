import React, { useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { i18n as I18nInstance } from 'i18next';

import { I18nProvider } from './i18n/I18nProvider';
import { initI18n } from './i18n/init-i18n';
import type { SupportedLocale } from './i18n/resolve-device-locale';
import { syncLayoutDirection } from './i18n/sync-layout-direction';
import HomeScreen from './screens/HomeScreen';
import { attachAuthStateListener } from './state/auth-store';

// Testable app factory (the runtime shell is index.js, which only registers
// this component) — mirrors the app.ts/server.ts split in apps/server.
export type RootStackParamList = {
  Home: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const App = (): React.JSX.Element | null => {
  const [i18nInstance, setI18nInstance] = useState<I18nInstance | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Attach before anything renders so cold-start session hydration
    // (INITIAL_SESSION from AsyncStorage) lands in the auth store; detached
    // in cleanup so remounts never leak listeners.
    const detachAuthListener = attachAuthStateListener();

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

  if (i18nInstance === null) {
    // Blank gate until the i18n instance is ready — rendering earlier would
    // flash raw translation keys (react-i18next's uninitialized default).
    return null;
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

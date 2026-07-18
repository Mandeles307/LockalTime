import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';

// Testable app factory (the runtime shell is index.js, which only registers
// this component) — mirrors the app.ts/server.ts split in apps/server.
export type RootStackParamList = {
  Home: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const App = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      {/* Header hidden: the navigator's screen name is not user-facing copy,
          and Phase 0 ships no UI strings ahead of the Phase 1 i18n setup. */}
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Home" component={HomeScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default App;

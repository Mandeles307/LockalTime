import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

// Phase 0 placeholder, now wired through the Phase 1 i18n foundation: all
// visible copy resolves via t() — never literals (i18next/no-literal-string
// enforces this at lint time). Real Home screen (session summary, create/join
// entry points) comes with Phase 2+. Neutral grayscale only — the color
// palette is intentionally deferred.
const HomeScreen = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.placeholder}>{t('home.title')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
  },
  placeholder: {
    color: '#444444',
    fontSize: 16,
  },
});

export default HomeScreen;

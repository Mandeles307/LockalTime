import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Phase 0 placeholder. Real Home screen (session summary, create/join entry
// points) comes with Phase 2+; i18n replaces the literal string in Phase 1.
// Neutral grayscale only — the color palette is intentionally deferred.
const HomeScreen = (): React.JSX.Element => {
  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.placeholder}>Lockal Time</Text>
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

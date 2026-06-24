import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { Colors } from './src/constants/theme';
import { useAppHydration } from './src/hooks/useAppHydration';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const ready = useAppHydration();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={Colors.background} />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#fef9ef" />
      <HomeScreen />
    </SafeAreaProvider>
  );
}

export default App;

registerRootComponent(App);

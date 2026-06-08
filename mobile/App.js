import React from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import CreateTripScreen from './src/screens/CreateTripScreen';

function App() {
  const [screen, setScreen] = React.useState('home');

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#fef9ef" />
      {screen === 'createTrip' ? (
        <CreateTripScreen onClose={() => setScreen('home')} />
      ) : (
        <HomeScreen onCreateTrip={() => setScreen('createTrip')} />
      )}
    </SafeAreaProvider>
  );
}

export default App;

registerRootComponent(App);

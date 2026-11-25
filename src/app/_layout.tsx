import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/lib/auth';
import { GameProvider } from '@/lib/game-store';
import { TownLifeProvider } from '@/lib/town-life';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { loading, player } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  return (
    <Stack>
      <Stack.Protected guard={!player}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ title: 'Create account' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!player}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="arcade" options={{ title: 'Arcade' }} />
        <Stack.Screen name="shop" options={{ title: 'Shop' }} />
        <Stack.Screen name="town-hall" options={{ title: 'Town Hall' }} />
        <Stack.Screen name="park" options={{ title: 'Park' }} />
        <Stack.Screen name="house" options={{ title: 'Your House' }} />
        <Stack.Screen name="avatar" options={{ title: 'Your Look' }} />
        <Stack.Screen name="games/catch" options={{ title: 'Catch!' }} />
        <Stack.Screen name="games/match3" options={{ title: 'Fruit Match' }} />
        <Stack.Screen name="daily" options={{ title: 'Today in Town' }} />
        <Stack.Screen name="snack-shack" options={{ title: 'Snack Shack' }} />
        <Stack.Screen name="stickers" options={{ title: 'Sticker Book' }} />
        <Stack.Screen name="party" options={{ title: 'Party' }} />
        <Stack.Screen name="bloop" options={{ title: 'Your Bloop' }} />
        <Stack.Screen name="games/snack-job" options={{ title: 'Snack Shack Job' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <GameProvider>
          <TownLifeProvider>
            <RootStack />
          </TownLifeProvider>
        </GameProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

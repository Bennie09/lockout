import { Fraunces_500Medium_Italic, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { colors } from '@/constants/theme';
import { StoreProvider, useStore } from '@/store/StoreProvider';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, state } = useStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!state.onboarded && !inOnboarding) {
      router.replace('/onboarding/welcome');
    } else if (state.onboarded && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [ready, state.onboarded, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brass} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_700Bold,
    Fraunces_500Medium_Italic,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StoreProvider>
        <Gate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="challenge" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="window-editor" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
          </Stack>
        </Gate>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

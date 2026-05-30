import IntroScreen from "@/components/auth/IntroScreen";
import { useAuth } from "@/ctx/AuthContext";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import AuthProvider from "@/Providers/AuthProvider";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function RootLayoutNav() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Handle deep linking for magic link
  useDeepLinking();

  useEffect(() => {
    if (!loading && session) {
      if (!profile || !profile.onboarding_completed) {
        const inOnboarding = segments[0] === "onboarding";

        if (!inOnboarding) {
          router.replace("/onboarding");
        }
      }
    }
  }, [session, loading, profile, segments]);

  if (!loaded || loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!session) {
    return (
      <ThemeProvider value={DefaultTheme}>
        <GestureHandlerRootView style={styles.container}>
          <IntroScreen />
        </GestureHandlerRootView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <GestureHandlerRootView style={styles.container}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
        </Stack>
      </GestureHandlerRootView>
      <StatusBar />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
});

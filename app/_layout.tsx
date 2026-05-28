import IntroScreen from "@/components/auth/IntroScreen";
import { useAuth } from "@/ctx/AuthContext";
import AuthProvider from "@/Providers/AuthProvider";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function RootLayoutNav() {
  const { session, loading, profile } = useAuth();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

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

  return <Stack />;
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

import Routes from "@/components/routes";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Routes />

        <Stack
          screenOptions={{
            headerShown: false,
            title: "Campus Confession",
            animation: "none",
            gestureEnabled: false,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="confessions"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="new-confession"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="confession/[id]"
            options={{
              animation: "slide_from_right",
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

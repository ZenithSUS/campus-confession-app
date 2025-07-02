import Routes from "@/components/routes";
import { CommentProvider } from "@/context/comment";
import { SessionProvider } from "@/context/session";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CommentProvider>
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
                  name="top-confessions"
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
        </CommentProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

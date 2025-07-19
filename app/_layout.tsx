import Routes from "@/components/routes";
import { CommentProvider } from "@/context/comment";
import { SessionProvider } from "@/context/session";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Stack } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

Sentry.init({
  dsn: "https://1334fdfaf88949f2a7533aca85b622eb@o4509686872670208.ingest.us.sentry.io/4509686908977152",
  enabled: true,
  debug: true,
});
Sentry.setExtras({
  manifest: Updates.manifest,
  deviceYearClass: Device.deviceYearClass,
  linkingUri: Constants.linkingUri,
});
Sentry.setTag("expoChannel", Updates.channel);
Sentry.setTag("appVersion", Application.nativeApplicationVersion);
Sentry.setTag("deviceId", Constants.sessionId);
Sentry.setTag("executionEnvironment", Constants.executionEnvironment);
Sentry.setTag("expoGoVersion", Constants.expoVersion);
Sentry.setTag("expoRuntimeVersion", Constants.expoRuntimeVersion);

const queryClient = new QueryClient();

export default Sentry.wrap(function App() {
  useEffect(() => {
    if (Platform.OS === "web") {
      document.title = "Zenith Campus Confession";
    }
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <CommentProvider>
            <SafeAreaProvider>
              <SafeAreaView className="flex-1 bg-white">
                <Routes />

                <Stack
                  initialRouteName="index"
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
    </>
  );
});

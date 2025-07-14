import Routes from "@/components/routes";
import { CommentProvider } from "@/context/comment";
import { SessionProvider } from "@/context/session";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Helmet } from "react-helmet";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CommentProvider>
          <SafeAreaProvider>
            <Helmet>
              <title>Campus Confession</title>
              <link
                rel="icon"
                type="image/png"
                href="../assets/icons/ZenithConfession.png"
              />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
              />
              <meta
                name="description"
                content="This app is for campus confession who want to confess their problems"
              />
              <meta name="author" content="ZenithSUS" />
            </Helmet>
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
  );
}

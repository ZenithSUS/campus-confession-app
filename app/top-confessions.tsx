import ConfessionCard from "@/components/confession-card";
import { useSession } from "@/context/session";
import { useGetTopConfessions } from "@/hooks/useConfession";
import { ShowConfessions } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { EyeIcon, RefreshCwIcon, TrophyIcon } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

const TopConfessions = () => {
  // Local state
  const [refresh, setRefresh] = useState(false);

  // Hooks
  const queryClient = useQueryClient();
  const { refreshSession, isLoading: isLoadingSession } = useSession();

  // Fetch data in API
  const {
    data: confessions,
    isLoading: topConfessionsLoading,
    refetch: refetchConfessions,
    error,
  } = useGetTopConfessions();

  const isAnyLoading = useMemo(() => {
    if (error && !refresh) return false;
    return topConfessionsLoading || isLoadingSession;
  }, [topConfessionsLoading, isLoadingSession, error]);

  const isDataLoaded = useMemo(() => {
    if (!!error) return true;
    return !!confessions;
  }, [confessions, error]);

  const topConfessions = useMemo(() => {
    if (!isDataLoaded) return [];
    return confessions;
  }, [isDataLoaded, confessions]);

  const renderItem = useCallback(
    ({ item }: { item: ShowConfessions }) => (
      <ConfessionCard confession={item} />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: ShowConfessions) => item.$id.toString(),
    []
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefresh(true);
      queryClient.removeQueries({ queryKey: ["topConfessions"] });
      await Promise.all([refetchConfessions(), refreshSession()]);
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefresh(false);
    }
  }, [queryClient, refetchConfessions, refreshSession, setRefresh, error]);

  if (isAnyLoading || !isDataLoaded) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
        <Text className="mt-2 text-gray-600">Loading top confessions...</Text>
      </View>
    );
  }

  if (!!error) {
    const confessionError = error as Error;
    // Get the first available error
    const currentError = confessionError;

    // Check if it's a timeout or network error
    const isTimeoutError =
      currentError?.message?.includes("not responding") ||
      currentError?.message?.includes("timeout");
    const isNetworkError =
      currentError?.message?.includes("connect to server") ||
      currentError?.message?.includes("Network Error");

    return (
      <View className="flex-1 items-center justify-center min-h-screen px-4">
        <View className="flex-col items-center gap-4">
          <Text
            className="text-center text-lg font-semibold"
            style={{ color: "red" }}
          >
            {isTimeoutError
              ? "Server is not responding"
              : isNetworkError
              ? "Connection failed"
              : "Something went wrong"}
          </Text>

          <Text className="text-gray-600 text-center">
            {isTimeoutError
              ? "The server is taking too long to respond. Please try again."
              : isNetworkError
              ? "Please check your internet connection and try again."
              : currentError?.message || "An unexpected error occurred"}
          </Text>

          <Pressable
            onPress={onRefresh}
            className="mt-4 px-2 py-2 rounded-full"
            style={{ backgroundColor: "#1C1C3A" }}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!topConfessions || topConfessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <Text className="text-lg font-bold text-gray-800">
          No confessions found
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-4 py-2">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-2">
        <TrophyIcon size={30} color={"#1C1C3A"} />
        <Text className="font-bold text-lg text-gray-800">Top Confessions</Text>
      </View>

      {/* FlatList without flex-1 to prevent it from taking all space */}
      <FlatList
        data={topConfessions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        ListEmptyComponent={
          <View className="justify-center items-center p-4">
            <Text className="text-lg font-bold text-gray-800">
              No confessions found
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        numColumns={1}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        initialNumToRender={5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        windowSize={21}
        extraData={topConfessions}
      />

      <View className=" flex-row px-2 py-4 gap-2 mt-4">
        <Pressable
          onPress={() => router.push("/")}
          className="flex-1 flex-row rounded-full px-4 py-2 items-center justify-center gap-2"
          style={{ backgroundColor: "#1C1C3A" }}
        >
          <EyeIcon size={18} color="#fff" />
          <Text className="text-white font-semibold">View All</Text>
        </Pressable>

        <Pressable
          onPress={onRefresh}
          className="flex-row justify-center items-center px-4 py-2 rounded-full"
          style={{
            backgroundColor: "#1C1C3A",
            minHeight: 44,
            minWidth: 100,
          }}
        >
          <RefreshCwIcon size={24} color={"#fff"} />
        </Pressable>
      </View>
    </View>
  );
};

export default TopConfessions;

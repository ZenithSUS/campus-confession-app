import ConfessionCard from "@/components/confession-card";
import { useGetTopConfessions } from "@/hooks/useConfession";
import { ShowConfessions } from "@/utils/types";
import { router } from "expo-router";
import { EyeIcon } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

const TopConfessions = () => {
  // Local state
  const [refresh, setRefresh] = useState(false);

  // Fetch data in API
  const {
    data: confessions,
    isLoading: topConfessionsLoading,
    refetch: refetchConfessions,
    error,
  } = useGetTopConfessions();

  const isAnyLoading = useMemo(() => {
    return topConfessionsLoading;
  }, [topConfessionsLoading]);

  const isDataLoaded = useMemo(() => {
    return !!confessions;
  }, [confessions]);

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
      await refetchConfessions();
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefresh(false);
    }
  }, []);

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
          <Text className="text-error text-center text-lg font-semibold">
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

          <Button onPress={onRefresh} title="Try Again" />
        </View>
      </View>
    );
  }

  if (!topConfessions || topConfessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <Text className="text-lg font-bold">No confessions found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-4 py-2">
      {/* Header */}
      <View className="mb-3">
        <Text className="font-bold text-lg">Top Confessions</Text>
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
            <Text className="text-lg font-bold">No confessions found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        numColumns={1}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        initialNumToRender={5}
        windowSize={21}
      />

      <View className="p-3 mt-2">
        <Pressable
          onPress={() => router.push("/")}
          className="flex-1 flex-row rounded-full py-2 items-center justify-center gap-2 text-white"
          style={{ backgroundColor: "#1C1C3A" }}
        >
          <EyeIcon size={18} />
          <Text className="text-white font-semibold">View All</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default TopConfessions;

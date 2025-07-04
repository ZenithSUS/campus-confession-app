import ConfessionCard from "@/components/confession-card";
import Filter from "@/components/filter";
import Searchbar from "@/components/searchbar";
import { useSession } from "@/context/session";
import { useGetComments } from "@/hooks/useComment";
import { useGetConfession } from "@/hooks/useConfession";
import { useGetLikes } from "@/hooks/useLike";
import { posts } from "@/utils/posts";
import { ShowConfessions } from "@/utils/types";
import { useRouter } from "expo-router";
import { Feather } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

const Home = () => {
  const { isLoading: isLoadingSession, refreshSession } = useSession();
  const {
    data: fetchedconfessions,
    isLoading,
    refetch: refetchConfession,
    error: confessionError,
  } = useGetConfession();
  const {
    data: fetchedLikes,
    isLoading: likesLoading,
    refetch: refetchLikes,
    error: likesError,
  } = useGetLikes();
  const {
    data: fetchedComments,
    isLoading: commentsLoading,
    refetch: refetchComments,
    error: commentsError,
  } = useGetComments();

  const [refreshing, setRefreshing] = useState(false);
  const [filteredConfessions, setFilteredConfessions] = useState<
    ShowConfessions[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [randomNumber, setRandomNumber] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (fetchedconfessions && fetchedLikes && fetchedComments) {
      const data = posts(fetchedconfessions, fetchedLikes, fetchedComments);
      setRandomNumber(Math.random() - 0.5);
      setFilteredConfessions(data);
    }
  }, [fetchedconfessions, fetchedLikes, fetchedComments]);

  const hasError = useMemo(() => {
    return confessionError || likesError || commentsError;
  }, [confessionError, likesError, commentsError]);

  const isDataLoaded = useMemo(() => {
    if (hasError) return true;

    return !!fetchedconfessions && !!fetchedLikes && !!fetchedComments;
  }, [fetchedconfessions, fetchedLikes, fetchedComments, hasError]);

  const AnyLoading = useMemo(() => {
    if (hasError) return false;

    return (
      isLoading ||
      isLoadingSession ||
      likesLoading ||
      commentsLoading ||
      refreshing
    );
  }, [
    isLoading,
    isLoadingSession,
    likesLoading,
    commentsLoading,
    refreshing,
    hasError,
  ]);

  const displayedConfessions = useMemo(() => {
    let result = filteredConfessions;

    if (searchQuery) {
      return (result = result.filter(
        (confession) =>
          confession.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          confession.campus
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          confession.user?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }

    if (filterCategory) {
      if (filterCategory === "All") {
        return filteredConfessions;
      }

      return (result = result.filter(
        (confession) => confession.campus === filterCategory
      ));
    }

    return result;
  }, [filteredConfessions, searchQuery, filterCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchConfession(),
        refetchLikes(),
        refetchComments(),
        refreshSession(),
      ]);
    } catch (error: any) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderConfessionItem = useCallback(
    ({ item }: { item: ShowConfessions }) => (
      <ConfessionCard confession={item} />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: ShowConfessions) => item.$id.toString(),
    []
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilter = useCallback((category: string) => {
    setFilterCategory(category);
  }, []);

  // Show loading state
  if (AnyLoading || !isDataLoaded) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
        <Text className="mt-2 text-gray-600">Loading confessions...</Text>
      </View>
    );
  }

  // Show error state (includes timeout and network errors)
  if (hasError) {
    // Get the first available error
    const currentError = confessionError || likesError || commentsError;

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

  return (
    <View className="flex-1 bg-white px-4 py-2">
      <View className="flex-row items-center mb-3 gap-2">
        <View className="flex-1">
          <Searchbar onSearch={handleSearch} />
        </View>

        <View>
          <Filter onFilter={handleFilter} />
        </View>
      </View>

      <FlatList
        data={displayedConfessions}
        keyExtractor={keyExtractor}
        renderItem={renderConfessionItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 items-center justify-center min-h-[400px]">
              <Text className="font-bold text-lg text-center">
                {searchQuery || filterCategory
                  ? "No confessions match your search"
                  : "No confessions found yet"}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={21}
        initialNumToRender={10}
      />

      <View className="p-3 mt-4">
        <Pressable
          className="flex-row items-center justify-center px-4 py-2 rounded-full gap-2"
          style={{ backgroundColor: "#1C1C3A" }}
          onPress={() => router.push("/new-confession")}
        >
          <Feather size={24} color={"#fff"} />
          <Text className="text-white font-semibold ml-2">New Confession</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Home;

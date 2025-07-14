import ConfessionCard from "@/components/confession-card";
import Filter from "@/components/filter";
import Searchbar from "@/components/searchbar";
import { useSession } from "@/context/session";
import {
  useGetConfessionByQuery,
  useGetConfessionPagination,
} from "@/hooks/useConfession";
import { ShowConfessions } from "@/utils/types";
import { useRouter } from "expo-router";
import { Feather } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

const Home = () => {
  const { isLoading: isLoadingSession, refreshSession } = useSession();
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filteredConfessions, setFilteredConfessions] = useState<
    ShowConfessions[]
  >([]);
  const [filterCategory, setFilterCategory] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hooks
  const {
    data: fetchedconfessions,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    isLoading,
    refetch: refetchConfession,
    error: confessionError,
  } = useGetConfessionPagination();

  const {
    data: fetchedconfessionsByQuery,
    isLoading: isLoadingByQuery,
    error: confessionErrorByQuery,
    refetch: refetchByQuery,
    isFetching: isFetchingByQuery,
    isFetchingNextPage: isFetchingNextPageByQuery,
    fetchNextPage: fetchNextPageByQuery,
    hasNextPage: hasNextPageByQuery,
  } = useGetConfessionByQuery(debouncedSearchQuery);

  // Trigger the query again if the search query changes
  useEffect(() => {
    // Only refetch if there's actually a search query
    if (debouncedSearchQuery.trim().length > 0) {
      refetchByQuery();
    }
  }, [debouncedSearchQuery, refetchByQuery]);

  // Determine if we're in search mode
  const isSearchMode = debouncedSearchQuery.trim().length > 0;

  // Filter confessions based on current mode
  useEffect(() => {
    if (isSearchMode && fetchedconfessionsByQuery) {
      const data = fetchedconfessionsByQuery.pages.flat() as ShowConfessions[];
      setFilteredConfessions(data);
    } else if (!isSearchMode && fetchedconfessions) {
      const data = fetchedconfessions.pages.flat() as ShowConfessions[];
      setFilteredConfessions(data);
    } else if (isSearchMode && !fetchedconfessionsByQuery) {
      setFilteredConfessions([]);
    }
  }, [fetchedconfessions, fetchedconfessionsByQuery, isSearchMode]);

  // If search is loading
  const isFetchingAnyQuery = useMemo(() => {
    return isFetchingByQuery || isFetchingNextPageByQuery;
  }, [isFetchingByQuery, isFetchingNextPageByQuery]);

  // Determine current error state
  const hasError = useMemo(() => {
    return isSearchMode ? confessionErrorByQuery : confessionError;
  }, [confessionError, confessionErrorByQuery, isSearchMode]);

  // Determine if data is loaded
  const isDataLoaded = useMemo(() => {
    if (hasError) return true;
    return !!fetchedconfessions;
  }, [fetchedconfessions, hasError]);

  // Determine loading state
  const AnyLoading = useMemo(() => {
    if (hasError && !refreshing) return false;
    return isLoading || isLoadingSession || refreshing;
  }, [isLoading, isLoadingSession, refreshing, hasError]);

  // Structure data to be displayed
  const displayedConfessions = useMemo(() => {
    let result = filteredConfessions;

    if (filterCategory && filterCategory !== "All") {
      result = result.filter(
        (confession) => confession.campus === filterCategory
      );
    }

    return result;
  }, [filteredConfessions, filterCategory]);

  // Load More Pages (only for pagination mode)
  const handleLoadMore = useCallback(() => {
    if (!isSearchMode && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    } else if (isSearchMode && hasNextPageByQuery && !isFetchingByQuery) {
      fetchNextPageByQuery();
    }
  }, [
    isSearchMode,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPageByQuery,
    isFetchingByQuery,
    fetchNextPageByQuery,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isSearchMode) {
        await Promise.all([refetchByQuery(), refreshSession()]);
      } else {
        await Promise.all([refetchConfession(), refreshSession()]);
      }
    } catch (error: any) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [isSearchMode, refetchByQuery, refetchConfession, refreshSession]);

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
    // Remove leading and trailing spaces also remove special characters
    const santizeQuery = query
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
    setSearchQuery(santizeQuery);
    // Clear previous results immediately when search changes
    if (query.trim().length === 0) {
      setFilteredConfessions([]);
    }
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
    // Get the current error
    const currentError = hasError;

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

  return (
    <View className="flex-1 bg-white px-4 py-2">
      <View className="flex-row items-center mb-3 gap-2">
        <View>
          <Searchbar onSearch={handleSearch} />
        </View>

        <View className="flex-1">
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
        ListHeaderComponent={
          isFetchingAnyQuery || isLoadingByQuery ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color={"#1C1C3A"} />
              <Text className="text-gray-600">Searching confessions...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          displayedConfessions.length === 0 && !isFetchingAnyQuery ? (
            <View className="flex-1 items-center justify-center min-h-[400px]">
              <Text className="font-bold text-lg text-center">
                {isSearchMode || debouncedSearchQuery
                  ? "No confessions match your search"
                  : "No confessions found yet"}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          (isFetchingNextPage || isFetchingNextPageByQuery) &&
          (!isLoading || !isLoadingByQuery) ? (
            <View className="items-center py-2">
              <ActivityIndicator size="small" color={"#1C1C3A"} />
              <Text className="text-gray-600">Loading more confessions...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
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

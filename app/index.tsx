import ConfessionCard from "@/components/confession-card";
import Filter from "@/components/filter";
import Searchbar from "@/components/searchbar";
import { useSession } from "@/context/session";
import { useGetComments } from "@/hooks/useComment";
import { useGetConfession } from "@/hooks/useConfession";
import { useGetLikes } from "@/hooks/useLike";
import { posts } from "@/utils/posts";
import { shuffleData } from "@/utils/shuffle";
import { ShowConfessions } from "@/utils/types";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

const Home = () => {
  const { isLoading: isLoadingSession } = useSession();
  const {
    data: fetchedconfessions,
    isLoading,
    refetch: refetchConfession,
    error,
  } = useGetConfession();
  const {
    data: fetchedLikes,
    isLoading: likesLoading,
    refetch: refetchLikes,
  } = useGetLikes();
  const {
    data: fetchedComments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useGetComments();

  const [refreshing, setRefreshing] = useState(false);
  const [filteredConfessions, setFilteredConfessions] = useState<
    ShowConfessions[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (fetchedconfessions && fetchedLikes && fetchedComments) {
      const data = posts(fetchedconfessions, fetchedLikes, fetchedComments);
      setFilteredConfessions(shuffleData(data as ShowConfessions[]));
    }
  }, [fetchedconfessions, fetchedLikes, fetchedComments]);

  const isDataLoaded = useMemo(() => {
    return !!fetchedconfessions && !!fetchedLikes && !!fetchedComments;
  }, [fetchedconfessions, fetchedLikes, fetchedComments]);

  const AnyLoading = useMemo(() => {
    return (
      isLoading ||
      isLoadingSession ||
      likesLoading ||
      commentsLoading ||
      refreshing
    );
  }, [isLoading, isLoadingSession, likesLoading, commentsLoading, refreshing]);

  const displayedConfessions = useMemo(() => {
    let result = filteredConfessions;

    if (searchQuery) {
      result = result.filter(
        (confession) =>
          confession.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          confession.campus
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          confession.user?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory) {
      if (filterCategory === "All") {
        return filteredConfessions;
      }

      result = result.filter(
        (confession) => confession.campus === filterCategory
      );
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
      ]);
    } catch (error) {
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

  if (AnyLoading || !isDataLoaded) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <View className="flex-col items-center gap-2">
          <Text className="text-error text-center w-full">
            Something went wrong: {error?.message}
          </Text>
          <Button onPress={onRefresh} title="Retry" />
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

      <View className="bg-[#1C1C3A] p-3 rounded-full mt-4">
        <Button
          title="+ Create Confession"
          onPress={() => router.push("/new-confession")}
        />
      </View>
    </View>
  );
};

export default Home;

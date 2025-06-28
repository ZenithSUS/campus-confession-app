import ConfessionCard from "@/components/confession-card";
import { useGetComments } from "@/hooks/useComment";
import { useGetConfession } from "@/hooks/useConfession";
import { useGetLikes } from "@/hooks/useLike";
import { posts } from "@/utils/posts";
import { ShowConfessions } from "@/utils/types";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
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
    isLoading: confessionsLoading,
    refetch: refetchConfessions,
  } = useGetConfession();
  const {
    data: likes,
    isLoading: likesLoading,
    refetch: refetchLikes,
  } = useGetLikes();
  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useGetComments();

  const isAnyLoading = useMemo(() => {
    return likesLoading || commentsLoading || confessionsLoading;
  }, [likesLoading, commentsLoading, confessionsLoading]);

  const isDataLoaded = useMemo(() => {
    return !!likes && !!comments && !!confessions;
  }, [likes, comments, confessions]);

  const topConfessions = useMemo(() => {
    if (!isDataLoaded) return [];
    return posts(confessions!, likes!, comments!)
      .sort((a, b) => b.likesLength - a.likesLength)
      .slice(0, 10);
  }, [isDataLoaded, confessions, likes, comments]);

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
      await Promise.all([
        refetchConfessions(),
        refetchLikes(),
        refetchComments(),
      ]);
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefresh(false);
    }
  }, []);

  if (isAnyLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
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
        <Button title="See All" onPress={() => router.push("/")} />
      </View>
    </View>
  );
};

export default TopConfessions;

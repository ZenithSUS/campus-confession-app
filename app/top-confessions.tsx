import ConfessionCard from "@/components/confession-card";
import { useGetConfession } from "@/hooks/useConfession";
import { Confessions } from "@/utils/types";
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
  const [refresh, setRefresh] = useState(false);

  const { data: confessions, isLoading, refetch } = useGetConfession();

  // Memoize sorted confessions to prevent re-sorting on every render
  const topConfessions = useMemo(() => {
    if (!confessions) return [];
    return [...confessions].sort((a, b) => b.likes - a.likes).slice(0, 5);
  }, [confessions]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!confessions || confessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg font-bold">No confessions found</Text>
      </View>
    );
  }

  // Fixed: renderItem should receive the item parameter
  const renderItem = useCallback(({ item }: { item: Confessions }) => {
    return <ConfessionCard confession={item} />;
  }, []);

  // Fixed: keyExtractor should receive the item parameter
  const keyExtractor = useCallback((item: Confessions) => {
    return item.$id.toString();
  }, []);

  const onRefresh = () => {
    setRefresh(true);
    refetch().then(() => setRefresh(false));
  };

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

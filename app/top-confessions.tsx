import ConfessionCard from "@/components/confession-card";
import { useGetConfession } from "@/hooks/useConfession";
import { Confessions } from "@/utils/types";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  const [topConfessions, setTopConfessions] = useState<Confessions[]>([]);
  const { data: confessions, isLoading, refetch } = useGetConfession();

  useEffect(() => {
    if (confessions) {
      setTopConfessions(
        confessions.sort((a, b) => b.likesLength - a.likesLength).slice(0, 5)
      );
    }
  }, [confessions]);

  const renderItem = useCallback(
    ({ item }: { item: Confessions }) => <ConfessionCard confession={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item: Confessions) => item.$id.toString(),
    []
  );

  const onRefresh = () => {
    setRefresh(true);
    refetch().then(() => setRefresh(false));
  };

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

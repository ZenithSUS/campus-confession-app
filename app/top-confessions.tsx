import ConfessionCard from "@/components/confession-card";
import { useGetConfession } from "@/hooks/useConfession";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const TopConfessions = () => {
  const [refresh, setRefresh] = useState(false);

  const { data: confessions, isLoading, refetch } = useGetConfession();

  const onRefresh = () => {
    setRefresh(true);

    refetch().then(() => setRefresh(false));
  };

  return (
    <View className="flex-1 bg-white px-4 py-2">
      <Text className="font-bold text-lg">Top Confessions</Text>

      {!isLoading ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refresh} onRefresh={onRefresh} />
          }
        >
          <FlatList
            data={confessions?.sort((a, b) => b.likes - a.likes).slice(0, 5)}
            renderItem={({ item }) => <ConfessionCard confession={item} />}
            keyExtractor={(item) => item.$id.toString()}
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            numColumns={1}
            scrollEnabled={false}
          />
        </ScrollView>
      ) : (
        <ActivityIndicator size="large" />
      )}
    </View>
  );
};

export default TopConfessions;

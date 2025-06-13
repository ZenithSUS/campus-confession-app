import ConfessionCard from "@/components/confession-card";
import Filter from "@/components/filter";
import Searchbar from "@/components/searchbar";
import { useGetConfession } from "@/hooks/useConfession";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const Home = () => {
  const { data: confessions, isLoading, refetch, error } = useGetConfession();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, []);


  if (error) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <Text className="text-error text-center w-full">
          Something went wrong: {error.message}
          <Button onPress={onRefresh} title="Retry" />
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-4 py-2">
      {/* Header Section */}
      <View className="flex-row justify-between items-center mb-3">
        <Searchbar />
      </View>

      {/* Filter Bar */}
      <View className="mb-2">
        <Filter />
      </View>

      { !isLoading && !confessions?.length && !error && 
      <View className="flex-1 items-center justify-center min-h-screen">
        <Text className="font-bold">No confessions found</Text>
      </View>}

      {/* Feed */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={"#1C1C3A"} />
        ) : (
          <FlatList
            data={confessions}
            keyExtractor={(item) => item.$id.toString()}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEnabled={false}
            numColumns={1}
            renderItem={({ item }) => (
              <ConfessionCard confession={item} key={item.$id} />
            )}
          />
        )}
      </ScrollView>

      <View className="bg-[#1C1C3A] p-3 rounded-full">
        <Button
          title="+ Create Confession"
          onPress={() => router.push("/new-confession")}
        />
      </View>
    </View>
  );
};

export default Home;

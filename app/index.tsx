import ConfessionCard from "@/components/confession-card";
import Filter from "@/components/filter";
import Searchbar from "@/components/searchbar";
import { confessions } from "@/constants/confessions";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Button,
  FlatList,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

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

      {/* Feed */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <FlatList
          data={confessions}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          scrollEnabled={false}
          numColumns={1}
          renderItem={({ item }) => (
            <ConfessionCard confession={item} key={item.id} />
          )}
        />
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

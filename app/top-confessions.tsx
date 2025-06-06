import ConfessionCard from "@/components/confession-card";
import { confessions } from "@/constants/confessions";
import React, { useState } from "react";
import { FlatList, RefreshControl, ScrollView, Text, View } from "react-native";

const TopConfessions = () => {
  const [refresh, setRefresh] = useState(false);

  const onRefresh = () => {
    setRefresh(true);
    setTimeout(() => {
      setRefresh(false);
    }, 2000);
  };

  return (
    <View className="flex-1 bg-white px-4 py-2">
      <Text className="font-bold text-lg">Top Confessions</Text>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={onRefresh} />
        }
      >
        <FlatList
          data={confessions.sort((a, b) => b.likes - a.likes).slice(0, 5)}
          renderItem={({ item }) => <ConfessionCard confession={item} />}
          keyExtractor={(item) => item.id.toString()}
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          numColumns={1}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
};

export default TopConfessions;

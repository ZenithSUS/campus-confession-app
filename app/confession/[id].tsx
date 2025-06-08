import { useGetConfessionById } from "@/hooks/useConfession";
import { timeDifference } from "@/utils/calculate-time";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowBigLeftDash,
  Heart,
  Notebook,
  TextIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Confession = () => {
  const { id } = useLocalSearchParams();

  const {
    data: confession,
    isLoading,
    error,
  } = useGetConfessionById(id as string);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  if (!confession)
    return (
      <View className="flex-1 px-4 py-2">
        <View className="flex items-center justify-center">
          <Text className="font-bold text-lg">Confession not found</Text>;
        </View>
      </View>
    );

  if (error)
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <Text className="font-bold">{error.message}</Text>;
      </View>
    );

  return (
    <View className="flex-1 bg-white px-4 py-2 gap-2">
      {/* Header Section */}
      <View className="flex-row justify-between items-center">
        <Text className="font-bold text-lg">Confession Details</Text>

        <TouchableOpacity
          className="flex-row items-center gap-2"
          onPress={() => router.back()}
        >
          <ArrowBigLeftDash size={22} color="#1C1C3A" />
          <Text>Back</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <View className="flex col gap-2 bg-gray-100 px-4 py-2 rounded-xl">
          {/* User Info */}
          <View className="flex-col gap-2">
            <Text className="font-bold">{confession.user}</Text>
            <Text>{confession.text}</Text>
          </View>

          {/* Actions */}
          <View className="flex-row justify-between">
            <View className="flex-row gap-2 items-center">
              <View className="flex-row gap-2 items-center">
                <Heart size={18} color="#6B7280" />
                <Text>{confession.likes}</Text>
              </View>

              <View className="flex-row gap-2 items-center">
                <TextIcon size={18} color="#6B7280" />
                <Text>{confession.comments}</Text>
              </View>
            </View>

            {/* Time */}
            <View className="flex-row gap-2 items-center">
              <Text>{timeDifference(confession.$createdAt)} ago</Text>
            </View>
          </View>
        </View>
      )}

      {/* Comments */}

      <View className="flex-row gap-2 items-center">
        <Notebook size={18} color="#6B7280" />
        <Text className="font-bold text-lg">Comments</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Text className="font-bold">No comments yet</Text>
      </ScrollView>
    </View>
  );
};

export default Confession;

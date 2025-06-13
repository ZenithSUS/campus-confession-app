import { useGetConfessionById } from "@/hooks/useConfession";
import { timeDifference } from "@/utils/calculate-time";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowBigLeftDash,
  Heart,
  Notebook,
  TextIcon,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Confession = () => {
  const { id } = useLocalSearchParams();
  const {
    data: confession,
    isLoading,
    refetch,
    error,
  } = useGetConfessionById(id as string);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardOffSet, setKeyboardOffSet] = useState(0);
  const { control, handleSubmit, formState } = useForm();

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardOffSet(Platform.OS === "ios" ? 80 : 100);
    })

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOffSet(0);
    })

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    }
  })

  const onRefresh = () => {
    setRefreshing(true);
    refetch().then(() => setRefreshing(false));
  };

  if (!isLoading && !confession)
    return (
      <View className="flex-1 px-4 py-2">
        <View className="flex items-center justify-center">
          <Text className="font-bold text-lg">Confession not found</Text>;
        </View>
      </View>
    );

  if (!isLoading && error)
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <Text className="font-bold">{error.message}</Text>;
      </View>
    );

  return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={keyboardOffSet}
  >
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

      {isLoading || !confession ? (
        <ActivityIndicator />
      ) : (
        <View className="flex col gap-2 bg-gray-100 px-4 py-2 rounded-xl">
          <View className="flex-col gap-2">
            <Text className="font-bold">{confession.user}</Text>
            <Text>{confession.text}</Text>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-row gap-2 items-center">
              <Heart size={18} color="#6B7280" />
              <Text>{confession.likes}</Text>

              <TextIcon size={18} color="#6B7280" />
              <Text>{confession.comments}</Text>
            </View>

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
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-bold">No comments yet</Text>
      </ScrollView>

      {/* Leave a comment input */}
      <View className="gap-2 bg-gray-100 px-4 py-2 rounded-xl">
        <Text className="font-bold">Leave a comment</Text>

        <Controller
          control={control}
          name="comment"
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Your comment..."
              className="w-full px-4 py-2 rounded-xl bg-white"
              numberOfLines={4}
              multiline
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
      </View>
    </View>
  </KeyboardAvoidingView>
);

};

export default Confession;

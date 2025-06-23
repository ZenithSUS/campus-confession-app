import { useGetChildrenCommentsById } from "@/hooks/useChildrenComment";
import { ShowChildrenComment } from "@/utils/types";
import React, { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

const ChildrenCommentItems = ({ item }: { item: ShowChildrenComment }) => {
  return (
    <View className="flex-col shadow p-5 gap-2 bg-white rounded-xl">
      <Text>{item.author}</Text>
      <Text className="text-sm">{item.content}</Text>
    </View>
  );
};

const ChildrenCommentCard = ({ commentId }: { commentId: string }) => {
  const { data: childrenComments, isLoading } =
    useGetChildrenCommentsById(commentId);

  const keyExtractor = useCallback(
    (items: ShowChildrenComment) => items.$id.toString(),
    []
  );

  const renderChildrenComment = useCallback(
    ({ item }: { item: ShowChildrenComment }) => (
      <ChildrenCommentItems item={item} />
    ),
    []
  );

  if (isLoading) {
    return (
      <View className="flex-1 p-4 justify-center items-center min-h-screen">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <FlatList
        data={childrenComments}
        keyExtractor={keyExtractor}
        renderItem={renderChildrenComment}
        ListHeaderComponent={
          <Text className="flex-1 text-start font-bold text-lg mb-2">
            Replies
          </Text>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-2">
            <Text className="font-bold text-lg p-4">No Replies Yet.</Text>
          </View>
        }
      />
    </View>
  );
};

export default ChildrenCommentCard;

import { useSession } from "@/context/session";
import { useGetChildrenCommentsById } from "@/hooks/useChildrenComment";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { ShowChildrenComment } from "@/utils/types";
import { Heart } from "lucide-react-native";
import React, { useCallback, useTransition } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ChildrenCommentItems = ({ item }: { item: ShowChildrenComment }) => {
  const { session } = useSession();
  const [isPending, startTransition] = useTransition();
  const isLiked = item.likesData
    .map((like) => like.userId)
    .includes(session.$id);

  const handleLike = () => {
    try {
      startTransition(async () => {
        if (isLiked) {
          const likeId = item.likesData.find(
            (like) => like.userId === session.$id
          )?.$id;
          await useDeleteLike(likeId!);
        } else {
          const data = {
            childrenCommentId: item.$id,
            userId: session.$id,
          };
          await useCreateLike(data);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-col shadow p-3 gap-2 bg-white rounded-xl">
      <Text className="font-bold">{item.author}</Text>
      <Text className="text-sm py-2">{item.content}</Text>

      <View className="flex-row justify-between items-center">
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-row items-center gap-2 cursor-pointer"
            onPress={handleLike}
          >
            <Heart
              size={18}
              color={isPending ? "gray" : isLiked ? "red" : "#6b7280"}
            />
            <Text>{item.likesLength}</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs">{timeDifference(item.$createdAt)} ago</Text>
      </View>
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
      <View className="flex-1 p-4 justify-center items-center mt-2">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={childrenComments}
        keyExtractor={keyExtractor}
        renderItem={renderChildrenComment}
        ListHeaderComponent={
          <Text className="flex-1 text-start font-bold text-lg mb-2">
            Replies
          </Text>
        }
        scrollEnabled={true}
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

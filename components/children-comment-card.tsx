import { useSession } from "@/context/session";
import { useGetChildrenCommentsById } from "@/hooks/useChildrenComment";
import { useCreateLike, useDeleteLike, useGetLikes } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { replies } from "@/utils/replies";
import { ShowChildrenComment } from "@/utils/types";
import { Heart } from "lucide-react-native";
import React, { useCallback, useMemo, useTransition } from "react";
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
  const { mutateAsync: CreateLike } = useCreateLike();
  const { mutateAsync: DeleteLike } = useDeleteLike();
  const isLiked = useMemo(() => {
    return item.likesData.some((like) => like.userId === session.$id);
  }, [item.likesData]);

  const handleLike = () => {
    try {
      startTransition(async () => {
        if (isLiked) {
          const likeId = item.likesData.find(
            (like) => like.userId === session.$id
          )?.$id;
          await DeleteLike(likeId!);
        } else {
          const data = {
            childrenCommentId: item.$id,
            userId: session.$id,
          };
          await CreateLike(data);
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
            activeOpacity={0.7}
            disabled={isPending}
          >
            <Heart
              size={18}
              color={isPending ? "gray" : isLiked ? "red" : "#6b7280"}
              strokeWidth={2}
              disabled={isPending}
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
  const { data: childrenComments, isLoading: isChildrenCommentsLoading } =
    useGetChildrenCommentsById(commentId);
  const { data: childrenLikes, isLoading: isLikesLoading } = useGetLikes();

  const isDataLoaded = useMemo(() => {
    return childrenComments && childrenLikes;
  }, [childrenComments, childrenLikes]);

  const isAnyLoading = useMemo(() => {
    return isChildrenCommentsLoading || isLikesLoading;
  }, [isChildrenCommentsLoading, isLikesLoading]);

  const processedReplies = useMemo(() => {
    if (!isDataLoaded) return [];
    return replies(childrenComments!, childrenLikes!);
  }, [childrenComments, childrenLikes]);

  const keyExtractor = useCallback(
    (items: ShowChildrenComment) => items.$id.toString(),
    []
  );

  const renderChildrenComment = useCallback(
    ({ item }: { item: ShowChildrenComment }) => (
      <ChildrenCommentItems item={item} key={item.$id} />
    ),
    []
  );

  if (isAnyLoading) {
    return (
      <View className="flex-1 p-4 justify-center items-center mt-2">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
        <Text className="text-sm p-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={processedReplies}
        keyExtractor={keyExtractor}
        renderItem={renderChildrenComment}
        ListHeaderComponent={
          <Text className="flex-1 text-start font-bold text-lg mb-2">
            Replies
          </Text>
        }
        scrollEnabled={true}
        initialNumToRender={10}
        ItemSeparatorComponent={() => <View className="h-4" />}
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

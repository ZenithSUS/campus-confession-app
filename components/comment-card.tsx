import { useComment } from "@/context/comment";
import { useSession } from "@/context/session";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { Comments } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, TextIcon } from "lucide-react-native";
import React, { useState, useTransition } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import ChildrenCommentCard from "./children-comment-card";

const CommentCard = ({ comment }: { comment: Comments }) => {
  const [isShowReply, setIsShowReply] = useState(false);
  const { dispatch } = useComment();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { session } = useSession();
  const isLiked = comment.likesData
    .map((like) => like.userId)
    .includes(session.$id);

  const handleReply = () => {
    dispatch({ type: "SET_ID", payload: comment.$id });
    dispatch({ type: "SET_TYPE", payload: "reply" });
    dispatch({ type: "SET_AUTHOR", payload: comment.author });
  };

  const handleLike = () => {
    try {
      startTransition(async () => {
        if (isLiked) {
          const likeId = comment.likesData.find(
            (like) => like.userId === session.$id
          )?.$id;
          await useDeleteLike(likeId!);
        } else {
          const data = {
            commentId: comment.$id,
            userId: session.$id,
          };

          await useCreateLike(data);
        }
      });

      if (!isPending)
        return queryClient.invalidateQueries({ queryKey: ["likes"] });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 p-2 flex-col gap-2">
      <View className="flex-col rounded-xl shadow gap-2 p-4">
        <Text className="font-bold">{comment.author}</Text>
        <Text className="py-2">{comment.content}</Text>

        <View className="flex-row items-center rounded-xl justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="flex-row items-center gap-2 cursor-pointer"
              onPress={handleLike}
            >
              <Heart
                size={18}
                color={isPending ? "gray" : isLiked ? "red" : "#6b7280"}
              />
              <Text>{comment.likesLength}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-2 cursor-pointer"
              onPress={() => setIsShowReply(!isShowReply)}
            >
              <TextIcon size={18} />
              <Text>{comment.repliesLength}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2">
            <Text>{timeDifference(comment.$createdAt)} ago</Text>
            <TouchableOpacity onPress={handleReply}>
              <Text className="font-semibold">Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isShowReply && (
        <View className="flex-col gap-2 p-5">
          <ChildrenCommentCard commentId={comment.$id} />
        </View>
      )}
    </View>
  );
};

export default CommentCard;

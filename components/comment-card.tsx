import { useComment } from "@/context/comment";
import { useSession } from "@/context/session";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { Comments } from "@/utils/types";
import { Heart, TextIcon } from "lucide-react-native";
import React, { useMemo, useTransition } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import ChildrenCommentCard from "./children-comment-card";

interface CommentCardProps {
  comment: Comments;
  openReplyId: string | null;
  setOpenReplyId: (id: string | null) => void;
}

const CommentCard = ({
  comment,
  openReplyId,
  setOpenReplyId,
}: CommentCardProps) => {
  const { state, dispatch } = useComment();
  const { session } = useSession();
  const { mutateAsync: CreateLike } = useCreateLike();
  const { mutateAsync: DeleteLike } = useDeleteLike();
  const [isPending, startTransition] = useTransition();
  const isShowReply = openReplyId === comment.$id;
  const isLiked = useMemo(() => {
    return comment.likesData.some((like) => like.userId === session.$id);
  }, [comment.likesData]);

  const handleReply = () => {
    dispatch({ type: "SET_ID", payload: comment.$id });
    dispatch({ type: "SET_TYPE", payload: "reply" });
    dispatch({ type: "SET_CONTENT", payload: comment.content });
    dispatch({ type: "SET_AUTHOR", payload: comment.author });

    if (isShowReply) {
      setOpenReplyId(null);
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_TYPE", payload: "comment" });
    } else {
      setOpenReplyId(comment.$id);
    }
  };

  const handleShowReplies = () => {
    dispatch({ type: "SET_ID", payload: comment.$id });
    dispatch({ type: "SET_TYPE", payload: "reply" });
    dispatch({ type: "SET_CONTENT", payload: comment.content });
    dispatch({ type: "SET_AUTHOR", payload: comment.author });

    if (isShowReply) {
      setOpenReplyId(null);
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_TYPE", payload: "comment" });
    } else {
      setOpenReplyId(comment.$id);
    }
  };

  const handleLike = () => {
    try {
      startTransition(async () => {
        if (isLiked) {
          const likeId = comment.likesData.find(
            (like) => like.userId === session.$id
          )?.$id;
          await DeleteLike(likeId!);
        } else {
          const data = {
            commentId: comment.$id,
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
    <View className="flex-1 p-2 flex-col gap-2">
      <View className="flex-col rounded-xl shadow gap-2 p-4">
        <Text className="font-bold">{comment.author}</Text>
        <Text className="py-2">{comment.content}</Text>

        <View className="flex-row items-center rounded-xl justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="flex-row items-center gap-2 cursor-pointer"
              onPress={handleLike}
              disabled={isPending}
            >
              <Heart
                size={18}
                color={isPending ? "gray" : isLiked ? "red" : "#6b7280"}
                strokeWidth={2}
                stroke={isPending ? "gray" : isLiked ? "red" : "#6b7280"}
                disabled={isPending}
              />
              <Text>{comment.likesLength}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-2 cursor-pointer"
              onPress={handleShowReplies}
            >
              <TextIcon size={18} />
              <Text>{comment.repliesLength}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2">
            <Text>{timeDifference(comment.$createdAt)} ago</Text>
            <TouchableOpacity onPress={handleReply}>
              <Text
                className="font-semibold"
                style={{
                  color:
                    state.type === "reply" && state.id === comment.$id
                      ? "blue"
                      : "black",
                }}
              >
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isShowReply && (
        <View className="flex-col gap-2 p-5">
          <ChildrenCommentCard key={comment.$id} commentId={comment.$id} />
        </View>
      )}
    </View>
  );
};

export default CommentCard;

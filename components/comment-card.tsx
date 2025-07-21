import { useComment } from "@/context/comment";
import { useSession } from "@/context/session";
import { useCreateLikeComment, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { Comments } from "@/utils/types";
import { Heart, MessageCircle } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import ChildrenCommentCard from "./children-comment-card";

interface CommentCardProps {
  comment: Comments;
  isReplyRefreshing: boolean;
  setIsReplyRefreshing: (refreshing: boolean) => void;
  openReplyId: string | null;
  setOpenReplyId: (id: string | null) => void;
}

const CommentCard = ({
  comment,
  isReplyRefreshing,
  setIsReplyRefreshing,
  openReplyId,
  setOpenReplyId,
}: CommentCardProps) => {
  // Render nothing if there are no comments
  if (!comment) return null;

  // Hooks
  const { state, dispatch } = useComment();
  const { session } = useSession();
  const { mutateAsync: CreateLike } = useCreateLikeComment();
  const { mutateAsync: DeleteLike } = useDeleteLike();
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  const isShowReply = useMemo(() => {
    return comment.$id === openReplyId;
  }, [comment.$id, openReplyId]);

  useEffect(() => {
    if (isReplyRefreshing) {
      isShowReply ? setOpenReplyId(comment.$id) : setOpenReplyId(null);
      setIsReplyRefreshing(false);
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_TYPE", payload: "comment" });
    }

    return () => {
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_TYPE", payload: "comment" });
    };
  }, [setIsReplyRefreshing]);

  const isLiked = useMemo(() => {
    if (!session?.$id || !comment.likesData) return false;
    return comment.likesData.some((like) => like.userId === session.$id);
  }, [comment.likesData, session.$id]);

  const handleReply = useCallback(() => {
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
  }, [
    isShowReply,
    comment.$id,
    comment.content,
    comment.author,
    dispatch,
    setOpenReplyId,
  ]);

  const handleShowReplies = useCallback(() => {
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
  }, [
    isShowReply,
    comment.$id,
    comment.content,
    comment.author,
    dispatch,
    setOpenReplyId,
  ]);

  const handleLike = useCallback(async () => {
    if (isLikeProcessing || !session?.$id) return;

    try {
      setIsLikeProcessing(true);

      if (isLiked) {
        const likeId = comment.likesData.find(
          (like) => like.userId === session.$id
        )?.$id;

        if (likeId) {
          await DeleteLike({
            likeId: likeId,
            commentId: comment.$id,
            confessionId: comment.confession.$id,
          });
        }
      } else {
        const data = {
          commentId: comment.$id,
          userId: session.$id,
          confessionId: comment.confession.$id,
        };
        await CreateLike(data);
      }
    } catch (error) {
      console.log("Error handling like:", error);
    } finally {
      setTimeout(() => {
        setIsLikeProcessing(false);
      }, 1000);
    }
  }, [
    isLikeProcessing,
    isLiked,
    comment.likesData,
    comment.$id,
    comment.confession.$id,
    session.$id,
    CreateLike,
    DeleteLike,
  ]);

  return (
    <View className="flex-col p-2 gap-2">
      <View className="flex-col rounded-2xl gap-2 p-4 border border-gray-100">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text
              className="font-semibold text-gray-800 text-base"
              numberOfLines={1}
            >
              {comment.author}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {timeDifference(comment.$createdAt)} ago
            </Text>
          </View>
        </View>
        <Text className="text-gray-800" style={{ lineHeight: 20 }}>
          {comment.content}
        </Text>

        <View className="flex-row items-center rounded-xl justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="flex-row items-center gap-2 py-2 px-3 rounded-full"
              style={{
                backgroundColor: isLiked ? "#fef2f2" : "transparent",
              }}
              onPress={handleLike}
              disabled={isLikeProcessing}
              delayPressIn={0}
              delayPressOut={0}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={18}
                color={isLikeProcessing ? "gray" : isLiked ? "red" : "#6b7280"}
                strokeWidth={2}
                fill={isLikeProcessing ? "gray" : isLiked ? "red" : "#6b7280"}
                stroke={isLikeProcessing ? "gray" : isLiked ? "red" : "#6b7280"}
              />
              <Text
                className={`text-sm font-medium ${
                  isLiked ? "text-red-500" : "text-gray-600"
                }`}
              >
                {comment.likesLength || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-2 py-2 px-3 rounded-full"
              onPress={handleShowReplies}
            >
              <MessageCircle size={18} color="#6b7280" />
              <Text className="text-gray-600 text-sm font-medium">
                {comment.repliesLength || 0}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2">
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

const areEqual = (prevProps: CommentCardProps, nextProps: CommentCardProps) => {
  const prevComment = prevProps.comment;
  const nextComment = nextProps.comment;

  // Check basic properties
  if (
    prevComment.$id !== nextComment.$id ||
    prevComment.content !== nextComment.content ||
    prevComment.author !== nextComment.author ||
    prevComment.likesLength !== nextComment.likesLength ||
    prevComment.repliesLength !== nextComment.repliesLength ||
    prevProps.openReplyId !== nextProps.openReplyId
  ) {
    return false;
  }

  // More efficient likes comparison
  const prevLikes = prevComment.likesData || [];
  const nextLikes = nextComment.likesData || [];

  if (prevLikes.length !== nextLikes.length) {
    return false;
  }

  // Create Sets for O(1) lookup instead of sorting arrays
  const prevLikeIds = new Set(prevLikes.map((like) => like.$id));
  const nextLikeIds = new Set(nextLikes.map((like) => like.$id));

  if (prevLikeIds.size !== nextLikeIds.size) {
    return false;
  }

  // Check if all IDs exist in both sets
  for (const id of prevLikeIds) {
    if (!nextLikeIds.has(id)) {
      return false;
    }
  }

  return true;
};

export default React.memo(CommentCard, areEqual);

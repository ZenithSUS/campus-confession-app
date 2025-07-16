import { useSession } from "@/context/session";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { ShowConfessions } from "@/utils/types";
import { router } from "expo-router";
import { Heart, MessageCircle } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";

interface ConfessionCardProps {
  confession: ShowConfessions;
}

const ConfessionCard = ({ confession }: ConfessionCardProps) => {
  const { session } = useSession();
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const { mutateAsync: CreateLike } = useCreateLike();
  const { mutateAsync: DeleteLike } = useDeleteLike();

  // Memoize author check
  const isAuthor = useMemo(() => {
    return confession.user === session?.nickname;
  }, [confession.user, session?.nickname]);

  // Memoize like status
  const isLiked = useMemo(() => {
    if (!session?.$id || !confession.likesData) return false;
    return confession.likesData.some((like) => like.userId === session.$id);
  }, [confession.likesData, session?.$id]);

  // Memoize time difference
  const timeAgo = useMemo(() => {
    return timeDifference(confession.$createdAt);
  }, [confession.$createdAt]);

  // Memoize user display name
  const userDisplayName = useMemo(() => {
    return isAuthor ? `You (${confession.user})` : confession.user;
  }, [isAuthor, confession.user]);

  // Handle like with better error handling
  const handleLike = useCallback(async () => {
    if (isLikeProcessing || !session?.$id || !confession) return;

    setIsLikeProcessing(true);
    try {
      if (isLiked) {
        const likeId = confession.likesData.find(
          (like) => like.userId === session.$id
        )?.$id;

        if (likeId) {
          await DeleteLike({
            likeId,
            confessionId: confession.$id,
          });
        }
      } else {
        const data = {
          confessionId: confession.$id,
          userId: session.$id,
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
    session?.$id,
    isLiked,
    confession.likesData,
    confession.$id,
    DeleteLike,
    CreateLike,
  ]);

  // Handle navigation to confession detail
  const handleNavigateToDetail = useCallback(() => {
    router.push(`/confession/${confession.$id}`);
  }, [confession.$id]);

  // Memoize tags component
  const TagsComponent = useMemo(() => {
    if (!confession.tags || confession.tags.length === 0) return null;

    return (
      <View
        className="flex-row items-center gap-2 mt-2"
        style={{ flexWrap: "wrap" }}
      >
        {confession.tags.map((tag, index) => (
          <View
            key={`${confession.$id}-tag-${index}`}
            className="px-2 py-1 rounded-full bg-blue-50 border border-blue-200"
          >
            <Text className="text-blue-700 font-medium text-xs">#{tag}</Text>
          </View>
        ))}
      </View>
    );
  }, [confession.tags, confession.$id]);

  return (
    <View className="mx-4 my-2">
      <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text
              className="font-semibold text-gray-800 text-base"
              numberOfLines={1}
            >
              {userDisplayName}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {timeAgo} ago • {confession.campus}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {TagsComponent}

        {/* Content */}
        <Pressable onPress={handleNavigateToDetail}>
          <View className="mt-3 mb-4">
            <Text
              className="text-gray-800 text-base leading-6"
              numberOfLines={4}
              style={{ lineHeight: 22 }}
            >
              {confession.text}
            </Text>
          </View>
        </Pressable>

        {/* Actions */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-50">
          <View className="flex-row items-center gap-4">
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
              activeOpacity={0.7}
            >
              <Heart
                size={18}
                color={
                  isLikeProcessing ? "#9ca3af" : isLiked ? "#ef4444" : "#6b7280"
                }
                fill={isLikeProcessing ? "none" : isLiked ? "#ef4444" : "none"}
              />
              <Text
                className={`text-sm font-medium ${
                  isLiked ? "text-red-500" : "text-gray-600"
                }`}
              >
                {confession.likesLength || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-2 py-2 px-3 rounded-full"
              onPress={handleNavigateToDetail}
              activeOpacity={0.7}
              delayPressIn={0}
              delayPressOut={0}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MessageCircle size={18} color="#6b7280" />
              <Text className="text-gray-600 text-sm font-medium">
                {confession.commentsLength || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default React.memo(ConfessionCard, (prevProps, nextProps) => {
  const prevConfession = prevProps.confession;
  const nextConfession = nextProps.confession;

  // Check if core data has changed
  if (
    prevConfession.$id !== nextConfession.$id ||
    prevConfession.text !== nextConfession.text ||
    prevConfession.user !== nextConfession.user ||
    prevConfession.campus !== nextConfession.campus ||
    prevConfession.likesLength !== nextConfession.likesLength ||
    prevConfession.commentsLength !== nextConfession.commentsLength
  ) {
    return false; // Re-render
  }

  // Check if likes data has changed
  if (
    prevConfession.likesData?.length !== nextConfession.likesData?.length ||
    JSON.stringify(prevConfession.likesData) !==
      JSON.stringify(nextConfession.likesData)
  ) {
    return false; // Re-render
  }

  // Check if tags have changed
  if (
    prevConfession.tags?.length !== nextConfession.tags?.length ||
    JSON.stringify(prevConfession.tags) !== JSON.stringify(nextConfession.tags)
  ) {
    return false; // Re-render
  }

  return true; // Don't re-render
});

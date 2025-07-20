import { useSession } from "@/context/session";
import { useGetChildrenCommentsPagination } from "@/hooks/useChildrenComment";
import { useCreateLikeReply, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { ShowChildrenComment } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Component to render a single comment
const ChildrenCommentItems = ({ item }: { item: ShowChildrenComment }) => {
  // Context and hooks
  const { session } = useSession();
  const { mutateAsync: CreateLike } = useCreateLikeReply();
  const { mutateAsync: DeleteLike } = useDeleteLike();

  // Use ref to track processing state to avoid re-renders
  const isLikeProcessingRef = useRef(false);
  const [, forceUpdate] = useState(0);

  // Check if the user has liked the comment
  const isLiked = useMemo(() => {
    return item.likesData.some((like) => like.userId === session.$id);
  }, [item.likesData, session.$id]);

  // Memoize the like count
  const likeCount = useMemo(() => item.likesLength, [item.likesLength]);

  // Handle like
  const handleLike = useCallback(async () => {
    // Check if the user is already processing a like
    if (isLikeProcessingRef.current) return;

    try {
      isLikeProcessingRef.current = true;
      forceUpdate((prev) => prev + 1);

      if (isLiked) {
        const likeId = item.likesData.find(
          (like) => like.userId === session.$id
        )?.$id;
        await DeleteLike({
          likeId: likeId!,
          childrenCommentId: item.$id,
          commentId: item.comment.$id,
        });
      } else {
        const data = {
          childrenCommentId: item.$id,
          commentId: item.comment.$id,
          userId: session.$id,
        };
        await CreateLike(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        isLikeProcessingRef.current = false;
        forceUpdate((prev) => prev + 1);
      }, 300);
    }
  }, [isLiked, session.$id, CreateLike, DeleteLike, item]);

  // Memoize the heart icon props
  const heartIconProps = useMemo(() => {
    const isProcessing = isLikeProcessingRef.current;
    const color = isProcessing ? "gray" : isLiked ? "red" : "#6b7280";

    return {
      size: 18,
      color,
      strokeWidth: 2,
      fill: color,
    };
  }, [isLiked, isLikeProcessingRef.current, useCreateLikeReply, useDeleteLike]);

  return (
    <View className="flex-col shadow p-3 gap-2 bg-white rounded-xl">
      <Text className="font-semibold text-gray-800 text-base">
        {item.author}
      </Text>
      <Text className="text-sm py-2 text-gray-800" style={{ lineHeight: 20 }}>
        {item.content}
      </Text>

      <View className="flex-row justify-between items-center">
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-row items-center gap-2 py-2 px-3 rounded-full"
            style={{ backgroundColor: isLiked ? "#fef2f2" : "transparent" }}
            onPress={handleLike}
            activeOpacity={0.7}
            disabled={isLikeProcessingRef.current}
            delayPressIn={0}
            delayPressOut={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart {...heartIconProps} />
            <Text
              className={`text-sm font-medium ${
                isLiked ? "text-red-500" : "text-gray-500"
              }`}
            >
              {likeCount || 0}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-gray-500">
          {timeDifference(item.$createdAt)} ago
        </Text>
      </View>
    </View>
  );
};

const ChildrenCommentCard = ({ commentId }: { commentId: string }) => {
  // Hooks
  const {
    data: childrenComments,
    isLoading: isChildrenCommentsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchChildrenComments,
    error: childrenCommentsError,
  } = useGetChildrenCommentsPagination(commentId);

  const queryClient = useQueryClient();

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchedReplies = useMemo(() => {
    if (!childrenComments) return [];

    return childrenComments.pages
      .flat()
      .sort(
        (a, b) =>
          b.likesLength - a.likesLength ||
          new Date(b.$createdAt.split("T")[0]).getTime() -
            new Date(a.$createdAt.split("T")[0]).getTime()
      ) as ShowChildrenComment[];
  }, [childrenComments]);

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["childrenComments", commentId],
    });
    refetchChildrenComments();
  }, [refetchChildrenComments, commentId]);

  const isDataLoaded = useMemo(() => {
    if (childrenCommentsError) return true;
    return !!childrenComments;
  }, [childrenComments, childrenCommentsError]);

  const isAnyLoading = useMemo(() => {
    if (childrenCommentsError) return false;
    return isChildrenCommentsLoading;
  }, [isChildrenCommentsLoading, childrenCommentsError]);

  // Callbacks and functions
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchNextPage().finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isLoadingMore]);

  // Memoize the list empty component
  const ListEmptyComponent = useMemo(
    () => (
      <View className="flex-1 justify-center items-center mt-2">
        <Text className="font-semibold text-lg p-4 text-gray-500">
          No Replies Yet.
        </Text>
      </View>
    ),
    []
  );

  // Memoize the list header component
  const ListHeaderComponent = useMemo(
    () => (
      <Text className="flex-1 text-start font-bold text-lg mb-2 text-gray-500">
        Replies
      </Text>
    ),
    []
  );

  // Memoize the item separator component
  const ItemSeparatorComponent = useMemo(() => <View className="h-4" />, []);

  const ListFooterComponent = useMemo(
    () => (
      <View className="flex-1 justify-center items-center mt-2">
        {(isFetchingNextPage || isLoadingMore) && (
          <ActivityIndicator size="large" color={"#1C1C3A"} />
        )}
        {hasNextPage && !isFetchingNextPage && !isLoadingMore && (
          <TouchableOpacity
            onPress={handleLoadMore}
            className="px-2 py-2 items-center justify-center rounded-full mt-2"
            style={{ backgroundColor: "#1C1C3A" }}
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold">Load More Replies</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [
      hasNextPage,
      isFetchingNextPage,
      isLoadingMore,
      handleLoadMore,
      childrenComments,
      refetchChildrenComments,
      isChildrenCommentsLoading,
    ]
  );

  if (isAnyLoading || !isDataLoaded) {
    return (
      <View className="flex-1 p-4 justify-center items-center mt-2">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
        <Text className="text-sm p-4 text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (childrenCommentsError) {
    const currentError = childrenCommentsError as { message: string };

    // Check if it's a timeout or network error
    const isTimeoutError =
      currentError?.message?.includes("not responding") ||
      currentError?.message?.includes("timeout");
    const isNetworkError =
      currentError?.message?.includes("connect to server") ||
      currentError?.message?.includes("Network Error");

    return (
      <View className="flex-1 p-4 justify-center items-center mt-2">
        <Text
          className="text-center font-bold text-lg p-4"
          style={{ color: "red" }}
        >
          {isTimeoutError
            ? "Timeout Error"
            : isNetworkError
            ? "Network Error"
            : "Error"}
        </Text>

        <Text className="text-center font-bold text-lg p-4">
          {isTimeoutError
            ? "Please try again."
            : isNetworkError
            ? "There is a problem with the network."
            : "Something went wrong."}
        </Text>

        <Pressable
          className="mt-2 px-2 py-2 rounded-full"
          style={{ backgroundColor: "#1C1C3A" }}
          onPress={onRefresh}
        >
          <Text className="text-center text-white">Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={fetchedReplies}
        keyExtractor={keyExtractor}
        renderItem={renderChildrenComment}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: "100%",
          paddingBottom: 100,
        }}
        style={{ flex: 1 }}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        extraData={fetchedReplies}
        ItemSeparatorComponent={() => ItemSeparatorComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
      />
    </View>
  );
};

export default React.memo(ChildrenCommentCard, (prevProps, nextProps) => {
  return prevProps.commentId === nextProps.commentId;
});

import { useSession } from "@/context/session";
import { useGetChildrenCommentsPagination } from "@/hooks/useChildrenComment";
import { useCreateLikeReply, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { ShowChildrenComment } from "@/utils/types";
import { Heart } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
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

  // Local state
  const [isPending, startTransition] = useTransition();

  // Check if the user has liked the comment
  const isLiked = useMemo(() => {
    return item.likesData.some((like) => like.userId === session.$id);
  }, [item.likesData, session.$id, CreateLike, DeleteLike]);

  // Handle like
  const handleLike = () => {
    try {
      startTransition(async () => {
        try {
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

  // Local state
  const [fetchedReplies, setFetchedReplies] = useState<ShowChildrenComment[]>(
    []
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (childrenComments) {
      const data = childrenComments.pages
        .flat()
        .sort(
          (a, b) =>
            b.likesLength - a.likesLength ||
            new Date(b.$createdAt.split("T")[0]).getTime() -
              new Date(a.$createdAt.split("T")[0]).getTime()
        ) as ShowChildrenComment[];
      setFetchedReplies(data);
    }

    return () => {
      setFetchedReplies([]);
    };
  }, [childrenComments]);

  const onRefresh = useCallback(() => {
    refetchChildrenComments();
  }, [refetchChildrenComments]);

  const isDataLoaded = useMemo(() => {
    if (childrenCommentsError) return true;
    return !!childrenComments;
  }, [childrenComments]);

  const isAnyLoading = useMemo(() => {
    if (childrenCommentsError) return false;

    return isChildrenCommentsLoading;
  }, [isChildrenCommentsLoading]);

  // Callbacks and functions
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchNextPage().finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoadingMore,
    fetchedReplies.length,
  ]);

  if (isAnyLoading || !isDataLoaded) {
    return (
      <View className="flex-1 p-4 justify-center items-center mt-2">
        <ActivityIndicator size="large" color={"#1C1C3A"} />
        <Text className="text-sm p-4">Loading...</Text>
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
        ListHeaderComponent={
          <Text className="flex-1 text-start font-bold text-lg mb-2">
            Replies
          </Text>
        }
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
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-2">
            <Text className="font-bold text-lg p-4">No Replies Yet.</Text>
          </View>
        }
        ListFooterComponent={
          <View className="flex-1 justify-center items-center mt-2">
            {(isFetchingNextPage || isLoadingMore) && (
              <ActivityIndicator size="large" color={"#1C1C3A"} />
            )}
            {hasNextPage && !isFetchingNextPage && !isLoadingMore && (
              <TouchableOpacity
                onPress={handleLoadMore}
                className="px-2 py-2 items-center justify-center rounded-full mt-2"
                style={{ backgroundColor: "#1C1C3A" }}
              >
                <Text className="text-white font-semibold">
                  Load More Replies
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.8}
      />
    </View>
  );
};
export default React.memo(ChildrenCommentCard);

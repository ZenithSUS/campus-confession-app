import CommentCard from "@/components/comment-card";
import { useComment } from "@/context/comment";
import { useSession } from "@/context/session";
import { useCreateChildenComment } from "@/hooks/useChildrenComment";
import {
  useCreateComment,
  useGetCommentsPaginatedByConfession,
} from "@/hooks/useComment";
import { useGetConfessionById } from "@/hooks/useConfession";
import { useGenerateComment } from "@/hooks/useConfessionAI";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { Comments, CreateComment } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowBigLeftDash,
  CogIcon,
  Heart,
  MessageCircle,
  Notebook,
  Send,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Confession = () => {
  const { id } = useLocalSearchParams();
  const { session, isLoading: sessionLoading, refreshSession } = useSession();
  const { state, dispatch } = useComment();
  const queryClient = useQueryClient();

  // Data fetching hooks
  const {
    data: confession,
    isLoading: confessionLoading,
    refetch: refetchConfession,
    error: confessionError,
  } = useGetConfessionById(id as string);
  const {
    data: confessionComments,
    isLoading: confessionCommentsLoading,
    refetch: refetchConfessionComments,
    error: confessionCommentsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetCommentsPaginatedByConfession(id as string);

  // Local state
  const [fetchedComments, setFetchedComments] = useState<Comments[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Mutation hooks
  const { mutateAsync: createComment } = useCreateComment();
  const { mutateAsync: createLike } = useCreateLike();
  const { mutateAsync: deleteLike } = useDeleteLike();
  const { mutateAsync: createChildrenComment } = useCreateChildenComment();
  const { mutateAsync: generateComment, error: generateCommentError } =
    useGenerateComment();

  // Form setup
  const commentForm = useForm<CreateComment>({
    defaultValues: {
      confession: "",
      author: "",
      content: "",
      userId: "",
    },
  });

  const generateCommentForm = useForm({
    defaultValues: {
      input: "",
    },
  });

  // Renders when data is fetched also if changes are detected
  useEffect(() => {
    if (confessionComments) {
      const comments = confessionComments?.pages.flat() as Comments[];
      setFetchedComments(comments);
    }

    return () => {
      setFetchedComments([]); // Clear the comments when the component unmounts
    };
  }, [confessionComments]);

  // Check if all required data is loaded
  const isDataLoaded = useMemo(() => {
    return !!(confession && confessionComments);
  }, [confession, confessionComments]);

  // Check if there is an error
  const isAnyError = useMemo(() => {
    return !!confessionError || !!confessionCommentsError;
  }, [confessionError, confessionCommentsError]);

  // Check if any data is loading
  const isAnyLoading = useMemo(() => {
    if (isAnyError && !refreshing) return false;

    return (
      confessionLoading ||
      confessionCommentsLoading ||
      sessionLoading ||
      refreshing
    );
  }, [
    confessionLoading,
    confessionCommentsLoading,
    sessionLoading,
    refreshing,
  ]);

  // Memoized processed data
  const processedPost = useMemo(() => {
    if (!isDataLoaded) return null;
    return confession;
  }, [confession, isDataLoaded]);

  // Check if user liked the post
  const isLiked = useMemo(() => {
    if (!processedPost?.likesData || !session?.$id) return false;
    return processedPost.likesData.some((like) => like.userId === session.$id);
  }, [processedPost?.likesData, session?.$id]);

  // Load More Pages in comments
  const handleLoadMoreComments = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isDataLoaded && processedPost) {
      setIsInitialLoad(false);
    }
  }, [isDataLoaded, processedPost]);

  // Reset form handler
  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_TYPE", payload: "comment" });
    commentForm.reset({
      confession: id as string,
      author: session?.nickname,
      content: "",
      userId: session?.$id,
    });
  }, [dispatch, commentForm.reset, id, session?.nickname, session?.$id]);

  // Like handler
  const handleLike = useCallback(async () => {
    if (!processedPost || !session) return;

    try {
      setIsLikeProcessing(true);
      setApiError(null);
      if (isLiked) {
        const likeId = processedPost.likesData?.find(
          (like) => like.userId === session.$id
        )?.$id;

        if (likeId) {
          await deleteLike({
            likeId: likeId,
            confessionId: processedPost.$id,
          });
        } else {
          throw new Error("Like not found");
        }
      } else {
        const data = {
          confessionId: processedPost.$id,
          userId: session.$id,
        };
        await createLike(data);
      }
    } catch (error) {
      console.log("There was an error on processing like:", error);
      setApiError("Failed to process like. Please try again.");
    } finally {
      setIsLikeProcessing(false);
    }
  }, [
    confession,
    session,
    isLiked,
    deleteLike,
    createLike,
    processedPost,
    isLikeProcessing,
    setApiError,
  ]);

  // GenerateComment handler
  const handleGenerateComment = useCallback(async () => {
    try {
      setApiError(null);
      setIsGenerating(true);
      let data = {
        input: generateCommentForm.getValues().input,
      };

      // Use the content from state if we're replying
      if (state.type === "reply" && state.content) {
        data.input = state.content;
      }

      const response = await generateComment(data);

      if (response?.output) {
        commentForm.setValue("content", response.output);
      } else {
        throw new Error("No data received from AI");
      }
    } catch (error) {
      console.log("Error generating comment:", error);
      setApiError(
        `Failed to generate ${
          state.type === "comment" ? "comment" : "reply"
        }. Please try again.`
      );
    } finally {
      setIsGenerating(false);
    }
  }, [
    generateComment,
    state.content,
    state.type,
    generateCommentForm,
    commentForm,
    setApiError,
  ]);

  // Comment submission handler
  const submitComment = useCallback(
    async (data: CreateComment) => {
      setApiError(null);
      if (!session) return;

      try {
        setIsSubmitting(true);
        if (state.type === "comment") {
          await createComment(data);
        } else {
          const replyData = {
            content: data.content,
            userId: session.$id,
            comment: state.id,
            author: session.nickname,
            confessionId: data.confession,
          };
          await createChildrenComment(replyData);
        }
        handleReset();
      } catch (error) {
        console.log("Error submitting comment:", error);
        setApiError("Failed to submit comment. Please try again.");
      } finally {
        setIsSubmitting(false);
        dispatch({ type: "RESET" });
        dispatch({ type: "SET_TYPE", payload: "comment" });
      }

      Keyboard.dismiss();
    },
    [state, session, createComment, createChildrenComment, handleReset]
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchConfession(),
        refetchConfessionComments(),
        refreshSession(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchConfession, refetchConfessionComments, refreshSession]);

  // Initialize comment context
  useEffect(() => {
    if (id && typeof id === "string") {
      dispatch({ type: "SET_ID", payload: id.toString() });
      dispatch({ type: "SET_TYPE", payload: "comment" });
    }

    return () => {
      dispatch({ type: "RESET" }); // Reset the form on unmount
    };
  }, [id, dispatch]);

  // Initialize form
  useEffect(() => {
    if (id && session?.nickname) {
      commentForm.reset({
        confession: id as string,
        author: session.nickname,
        content: "",
        userId: session.$id,
      });
    }

    return () => {
      commentForm.reset(); // Reset the form
    };
  }, [id, session?.nickname, commentForm.reset]);

  useEffect(() => {
    if (processedPost?.text) {
      generateCommentForm.setValue("input", processedPost?.text);
    }
  }, [processedPost?.text, dispatch]);

  const combinedData = useMemo(() => {
    if (!processedPost) return [];

    return [
      { type: "post", data: processedPost },
      ...(fetchedComments.length > 0
        ? [{ type: "comment-header" }]
        : [{ type: "empty-comment" }]),
      ...fetchedComments.map((comment) => ({ type: "comment", data: comment })),
    ];
  }, [processedPost, fetchedComments]);

  const TagsComponent = useMemo(() => {
    if (!processedPost?.tags || processedPost?.tags.length === 0) return null;

    return (
      <View
        className="flex-row items-center gap-2 mt-2"
        style={{ flexWrap: "wrap" }}
      >
        {processedPost?.tags.map((tag, index) => (
          <View
            key={`${processedPost?.$id}-tag-${index}`}
            className="px-2 py-1 rounded-full bg-blue-50 border border-blue-200"
          >
            <Text className="text-blue-700 font-medium text-xs">#{tag}</Text>
          </View>
        ))}
      </View>
    );
  }, [processedPost?.tags, processedPost?.$id]);

  const ListFooterComponent = useMemo(() => {
    if (isFetchingNextPage && hasNextPage)
      return (
        <View className="flex-row justify-center items-center py-4 gap-2">
          <ActivityIndicator size="small" color="#1C1C3A" />
          <Text className="ml-2 text-gray-600">Loading more comments...</Text>
        </View>
      );

    return null;
  }, [isFetchingNextPage, hasNextPage]);

  // Render Comments and Current Post
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === "post") {
        return (
          <View className="mx-4 my-2" key={`post-${item.data?.$id}`}>
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {/* Header */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text
                    className="font-semibold text-gray-800 text-base"
                    numberOfLines={1}
                  >
                    {item.data.user}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {timeDifference(item.data.$createdAt)} ago •{" "}
                    {item.data.campus}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              {TagsComponent}

              {/* Content */}
              <Pressable>
                <View className="mt-3 mb-4">
                  <Text
                    className="text-gray-800 text-base leading-6"
                    style={{ lineHeight: 22 }}
                  >
                    {item.data.text}
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
                        isLikeProcessing
                          ? "#9ca3af"
                          : isLiked
                          ? "#ef4444"
                          : "#6b7280"
                      }
                      fill={
                        isLikeProcessing ? "none" : isLiked ? "#ef4444" : "none"
                      }
                    />
                    <Text
                      className={`text-sm font-medium ${
                        isLiked ? "text-red-500" : "text-gray-600"
                      }`}
                    >
                      {item.data.likesLength || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center gap-2 py-2 px-3 rounded-full"
                    delayPressIn={0}
                    delayPressOut={0}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MessageCircle size={18} color="#6b7280" />
                    <Text className="text-gray-600 text-sm font-medium">
                      {item.data.commentsLength || 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );
      }

      if (item.type === "comment-header") {
        return (
          <View
            className="flex-row gap-2 items-center mb-4 mx-4"
            key="comment-header"
          >
            <Notebook size={20} color="#6B7280" />
            <Text className="font-bold text-lg">Comments</Text>
          </View>
        );
      }

      if (item.type === "comment") {
        return (
          <View key={`comment-${item.data?.$id}`} className="mx-4">
            <CommentCard
              comment={item.data}
              openReplyId={openReplyId}
              setOpenReplyId={setOpenReplyId}
            />
          </View>
        );
      }

      if (item.type === "empty-comment") {
        return (
          <View className="flex-row items-center mx-4" key="empty-comment">
            <Notebook size={20} color="#6B7280" />
            <Text className="font-bold text-lg">No Comments Yet.</Text>
          </View>
        );
      }

      return null;
    },
    [
      handleLike,
      isLikeProcessing,
      isLiked,
      openReplyId,
      setOpenReplyId,
      TagsComponent,
    ]
  );

  // Early returns after all hooks are defined
  if (isAnyLoading || !isDataLoaded || !processedPost || isInitialLoad) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <ActivityIndicator size="large" color="#1C1C3A" />
        <Text className="mt-2 text-gray-600">
          Loading confession details...
        </Text>
      </View>
    );
  }

  if (isAnyError) {
    const currentError = confessionError || confessionCommentsError;

    const isTimeoutError =
      currentError?.message?.includes("not responding") ||
      currentError?.message?.includes("timeout");

    const isNetworkError =
      currentError?.message?.includes("connect to server") ||
      currentError?.message?.includes("Network Error");

    return (
      <View className="flex-1 items-center justify-center min-h-screen px-4 gap-2">
        <Text className="font-bold text-center" style={{ color: "red" }}>
          {isTimeoutError
            ? "Server is not responding. Please try again."
            : isNetworkError
            ? "Connection error. Please check your internet connection."
            : "Something went wrong. Please try again."}
        </Text>
        <Pressable
          className="mt-4 px-4 py-2 rounded-xl"
          style={{ backgroundColor: "#1C1C3A" }}
          onPress={() => onRefresh()}
        >
          <Text className="text-white">Refresh</Text>
        </Pressable>
      </View>
    );
  }

  // If confession is not found
  if (!confession || !confessionComments) {
    return (
      <View className="flex-1 px-4 py-2">
        <View className="flex items-center justify-center">
          <Text className="font-bold text-lg">Confession not found</Text>
          <TouchableOpacity
            className="mt-4 px-4 py-2 rounded"
            onPress={() => router.back()}
            style={{ backgroundColor: "#1C1C3A" }}
          >
            <Text className="text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row justify-between items-center px-4 py-2 bg-white border-b border-gray-200">
          <Text className="font-bold text-lg">Confession Details</Text>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
            style={{
              padding: 8,
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowBigLeftDash size={20} color="#1C1C3A" />
            <Text className="text-sm">Back</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <FlatList
            data={combinedData}
            keyExtractor={(item, index) => {
              if (item.type === "post")
                return `post-${item.data?.$id ?? index}`;
              if (item.type === "comment-header") return "comment-header";
              if (item.type === "comment")
                return `comment-${item.data?.$id ?? index}`;
              return `item-${index}`;
            }}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onEndReached={handleLoadMoreComments}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{
              paddingVertical: 8,
              paddingBottom: 24,
              minHeight: "100%",
            }}
            extraData={openReplyId}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center min-h-[300px]">
                <Text className="font-bold text-lg">No comments yet</Text>
                <Text className="text-gray-600 mt-2">
                  Be the first to comment!
                </Text>
              </View>
            }
            ListFooterComponent={ListFooterComponent}
          />
        </View>

        <View className="bg-gray-100 px-4 py-3 border-t border-gray-200">
          <Text className="font-bold mb-2">Leave a comment</Text>
          <Controller
            control={commentForm.control}
            name="content"
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder={
                  state.type === "comment"
                    ? `What's on your mind, ${
                        session?.nickname || "Anonymous"
                      }?`
                    : `Reply to ${state.author}`
                }
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300"
                numberOfLines={4}
                multiline
                value={value}
                editable={!isSubmitting}
                onBlur={onBlur}
                onChangeText={onChange}
                textAlignVertical="top"
              />
            )}
          />

          {/* Error Messages */}
          {commentForm.formState.errors.content && (
            <Text className="mt-2" style={{ color: "red" }}>
              Comment field is required
            </Text>
          )}

          {(apiError || generateCommentError) && (
            <Text className="mt-2" style={{ color: "red" }}>
              {apiError ||
                generateCommentError?.message ||
                "Something went wrong"}
            </Text>
          )}

          <View className="flex-row items-center mt-2 gap-2">
            <Pressable
              onPress={commentForm.handleSubmit(submitComment)}
              disabled={isSubmitting}
              className="flex-row justify-center items-center px-4 py-3 rounded-full flex-1"
              style={{
                backgroundColor: isSubmitting ? "#6B7280" : "#1C1C3A",
                minHeight: 44,
              }}
            >
              <Send size={18} color="white" />
              <Text className="font-semibold text-white ml-2">
                {state.type === "comment" ? "Comment" : "Reply"}
              </Text>
            </Pressable>

            {state.type === "reply" && (
              <Pressable
                onPress={handleReset}
                className="flex-row justify-center items-center px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "#DC2626",
                  minHeight: 44,
                }}
              >
                <Text className="font-semibold text-white">Cancel</Text>
              </Pressable>
            )}
          </View>

          {/* Generate Comment Button */}
          <Pressable
            onPress={generateCommentForm.handleSubmit(handleGenerateComment)}
            disabled={isGenerating}
            className="flex-row justify-center items-center px-4 py-3 rounded-full mt-2"
            style={{
              backgroundColor: isGenerating ? "#6B7280" : "#1C1C3A",
              minHeight: 44,
            }}
          >
            <CogIcon size={18} color="white" />
            <Text className="font-semibold text-white ml-2">
              {isGenerating
                ? "Generating..."
                : `Generate ${state.type === "comment" ? "Comment" : "Reply"}`}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Confession;

import CommentCard from "@/components/comment-card";
import { useComment } from "@/context/comment";
import { useSession } from "@/context/session";
import {
  useCreateChildenComment,
  useGetChildrenComments,
} from "@/hooks/useChildrenComment";
import {
  useCreateComment,
  useGetComments,
  useGetCommentsByConfession,
} from "@/hooks/useComment";
import { useGetConfessionById } from "@/hooks/useConfession";
import { useGenerateComment } from "@/hooks/useConfessionAI";
import { useCreateLike, useDeleteLike, useGetLikes } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { commentData } from "@/utils/comments";
import { singlePost } from "@/utils/posts";
import { Comments, CreateComment } from "@/utils/types";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowBigLeftDash,
  CogIcon,
  Heart,
  Notebook,
  Send,
  TextIcon,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Confession = () => {
  const { id } = useLocalSearchParams();
  const { session } = useSession();
  const { state, dispatch } = useComment();

  // Data fetching hooks
  const {
    data: confession,
    isLoading: confessionLoading,
    refetch: refetchConfession,
    error,
  } = useGetConfessionById(id as string);
  const {
    data: likes,
    isLoading: likeLoading,
    refetch: refetchLikes,
    error: likeError,
  } = useGetLikes();
  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
    error: commentError,
  } = useGetComments();
  const {
    data: confessionComments,
    isLoading: confessionCommentsLoading,
    refetch: refetchConfessionComments,
    error: confessionCommentsError,
  } = useGetCommentsByConfession(id as string);
  const {
    data: replies,
    isLoading: replyLoading,
    refetch: refetchReplies,
    error: replyError,
  } = useGetChildrenComments();

  // Local state
  const [apiError, setApiError] = useState<string | null>(null);
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardOffSet, setKeyboardOffSet] = useState(0);
  const [isPending, startTransition] = useTransition();

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
    },
  });

  const generateCommentForm = useForm({
    defaultValues: {
      input: "",
    },
  });

  // Check if all required data is loaded
  const isDataLoaded = useMemo(() => {
    return !!(confession && likes && comments && confessionComments && replies);
  }, [confession, likes, comments, confessionComments, replies]);

  // Check if any data is loading
  const isAnyLoading = useMemo(() => {
    return (
      confessionLoading ||
      likeLoading ||
      commentsLoading ||
      confessionCommentsLoading ||
      replyLoading ||
      refreshing
    );
  }, [
    confessionLoading,
    likeLoading,
    commentsLoading,
    confessionCommentsLoading,
    replyLoading,
    refreshing,
  ]);

  const isAnyError = useMemo(() => {
    return (
      !!error ||
      !!likeError ||
      !!commentError ||
      !!confessionCommentsError ||
      !!replyError
    );
  }, [error, likeError, commentError, confessionCommentsError, replyError]);

  // Memoized processed data
  const processedPost = useMemo(() => {
    if (!isDataLoaded) return null;
    return singlePost(confession!, likes!, comments!);
  }, [confession, likes, comments, isDataLoaded]);

  const processedComments = useMemo(() => {
    if (!isDataLoaded) return [];
    return commentData(confessionComments!, likes!, replies!).reverse();
  }, [confessionComments, likes, replies, isDataLoaded]);

  // Check if user liked the post
  const isLiked = useMemo(() => {
    if (!processedPost?.likesData || !session?.$id) return false;
    return processedPost.likesData.some((like) => like.userId === session.$id);
  }, [processedPost?.likesData, session?.$id]);

  // Reset form handler
  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_TYPE", payload: "comment" });
    commentForm.reset({
      confession: id as string,
      author: session?.nickname || "",
      content: "",
    });
  }, [dispatch, commentForm.reset, id, session?.nickname]);

  // Like handler
  const handleLike = useCallback(async () => {
    if (!confession || !session) return;

    try {
      startTransition(async () => {
        if (isLiked) {
          const likeId = confession.likesData?.find(
            (like) => like.userId === session.$id
          )?.$id;

          if (likeId) {
            await deleteLike(likeId);
          }
        } else {
          const data = {
            confessionId: confession.$id,
            userId: session.$id,
          };
          await createLike(data);
        }

        // Refetch likes after mutation
        await refetchLikes();
      });
    } catch (error) {
      console.error("Error handling like:", error);
    }
  }, [confession, session, isLiked, deleteLike, createLike, refetchLikes]);

  // GenerateComment handler
  const handleGenerateComment = useCallback(async () => {
    startTransition(async () => {
      try {
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
        }
      } catch (error) {
        console.error("Error generating comment:", error);
        setApiError("Failed to generate comment. Please try again.");
      }
    });
  }, [
    generateComment,
    state.content,
    state.type,
    generateCommentForm,
    commentForm,
  ]);

  // Comment submission handler
  const submitComment = useCallback(
    async (data: CreateComment) => {
      setApiError(null);
      if (!session) return;

      try {
        startTransition(async () => {
          if (state.type === "comment") {
            await createComment(data);
            await refetchConfessionComments();
          } else {
            const replyData = {
              content: data.content,
              userId: session.$id,
              comment: state.id,
              author: session.nickname,
            };
            await createChildrenComment(replyData);
            await refetchReplies();
          }

          handleReset();
          await refetchComments();
        });
      } catch (error) {
        console.error("Error submitting comment:", error);
        setApiError("Failed to submit comment. Please try again.");
      } finally {
        dispatch({ type: "RESET" });
        dispatch({ type: "SET_TYPE", payload: "comment" });
      }
      Keyboard.dismiss();
    },
    [
      state,
      session,
      createComment,
      createChildrenComment,
      handleReset,
      refetchConfessionComments,
      refetchReplies,
      refetchComments,
    ]
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchConfession(),
        refetchLikes(),
        refetchComments(),
        refetchConfessionComments(),
        refetchReplies(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchConfession,
    refetchLikes,
    refetchComments,
    refetchConfessionComments,
    refetchReplies,
  ]);

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardOffSet(Platform.OS === "ios" ? 80 : 100);
    });

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOffSet(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Initialize comment context
  useEffect(() => {
    if (id && typeof id === "string") {
      dispatch({ type: "SET_ID", payload: id.toString() });
      dispatch({ type: "SET_TYPE", payload: "comment" });
    }
  }, [id, dispatch]);

  // Initialize form
  useEffect(() => {
    if (id && session?.nickname) {
      commentForm.reset({
        confession: id as string,
        author: session.nickname,
        content: "",
      });
    }
  }, [id, session?.nickname, commentForm.reset]);

  useEffect(() => {
    if (processedPost?.text) {
      generateCommentForm.setValue("input", processedPost?.text);
    }
  }, [processedPost?.text, dispatch]);

  // Render comment item - moved before any conditional returns
  const renderCommentItem = useCallback(
    ({ item }: { item: Comments }) => (
      <CommentCard
        comment={item}
        openReplyId={openReplyId}
        setOpenReplyId={setOpenReplyId}
      />
    ),
    [openReplyId]
  );

  // Early returns after all hooks are defined
  if (isAnyLoading || !isDataLoaded || !processedPost) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <ActivityIndicator size="large" color="#1C1C3A" />
        <Text className="mt-2 text-gray-600">Loading confession...</Text>
      </View>
    );
  }

  if (isAnyError) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen px-4 gap-2">
        <Text className="font-bold text-red-600 text-center">
          {error?.message}
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
            className="mt-4 px-4 py-2 bg-blue-500 rounded"
            onPress={() => router.back()}
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
      keyboardVerticalOffset={keyboardOffSet}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <View className="flex-1 bg-white px-4 py-2 gap-2">
          {/* Header Section */}
          <View className="flex-row justify-between items-center">
            <Text className="font-bold text-lg">Confession Details</Text>
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => router.back()}
            >
              <ArrowBigLeftDash size={22} color="#1C1C3A" />
              <Text>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Post Content */}
          {processedPost && (
            <View className="flex col gap-2 shadow p-5 rounded-xl">
              <View className="flex-col gap-2 py-2">
                <View className="flex-row justify-between">
                  <Text className="font-bold">
                    {processedPost.user} :{" "}
                    <Text className="font-normal">
                      {timeDifference(processedPost.$createdAt)}
                      {" ago"}
                    </Text>
                  </Text>
                  <Text>{processedPost.campus}</Text>
                </View>
                <Text>{processedPost.text}</Text>
              </View>

              <View className="flex-row justify-between">
                <View className="flex-row gap-2 items-center">
                  <TouchableOpacity
                    className="flex-row items-center gap-2"
                    onPress={handleLike}
                    disabled={isPending}
                  >
                    <Heart size={18} color={isLiked ? "red" : "#6B7280"} />
                    <Text>{processedPost.likesLength}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center gap-2">
                    <TextIcon size={18} color="#6B7280" />
                    <Text>{processedPost.commentsLength}</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-2 items-center">
                  <Text>{timeDifference(processedPost.$createdAt)} ago</Text>
                </View>
              </View>
            </View>
          )}

          {/* Comments Section */}
          {confessionComments.length > 0 ? (
            <View className="flex-row gap-2 items-center">
              <Notebook size={18} color="#6B7280" />
              <Text className="font-bold text-lg">Comments</Text>
            </View>
          ) : (
            <Text className="font-bold">No comments yet</Text>
          )}

          {/* Comments List */}
          {processedComments.length > 0 && (
            <FlatList
              data={processedComments}
              keyExtractor={(item) => item.$id.toString()}
              renderItem={renderCommentItem}
              nestedScrollEnabled={true}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={5}
              getItemLayout={undefined} // Let FlatList calculate
            />
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View className="flex-col gap-2 bg-gray-100 px-4 py-2 rounded-xl">
        <Text className="font-bold">Leave a comment</Text>
        <Controller
          control={commentForm.control}
          name="content"
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder={
                state.type === "comment"
                  ? `What's on your mind, ${session?.nickname || "Anonymous"}?`
                  : `Reply to, ${state.author}`
              }
              className="w-full px-4 py-2 rounded-xl bg-white"
              numberOfLines={4}
              multiline
              value={value}
              editable={!isPending}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />

        {/* Error API Message */}
        {commentForm.formState.errors.content && (
          <View className="flex-row items-center gap-2">
            <Text style={{ color: "red" }}>Comment field is required</Text>
          </View>
        )}

        {(apiError || generateCommentError) && (
          <Text style={{ color: "red" }}>
            {apiError ||
              generateCommentError?.message ||
              "Something went wrong"}
          </Text>
        )}

        <View className="flex-row items-center py-2 gap-2">
          {/* Comment Button */}
          <Pressable
            onPress={commentForm.handleSubmit(submitComment)}
            disabled={isPending}
            className="flex-row justify-center items-center px-4 py-2 gap-2 rounded-full flex-1"
            style={{ backgroundColor: isPending ? "#6B7280" : "#1C1C3A" }}
          >
            <Send size={18} color="white" />
            <Text className="font-bold text-lg text-white">
              {state.type === "comment" ? "Comment" : "Reply"}
            </Text>
          </Pressable>

          {/* Generate Reply Button */}
          <Pressable
            onPress={generateCommentForm.handleSubmit(handleGenerateComment)}
            disabled={isPending}
            className="flex-row justify-center items-center px-4 py-2 rounded-full gap-2"
            style={{ backgroundColor: isPending ? "#6B7280" : "#1C1C3A" }}
          >
            <CogIcon size={18} color="white" />
            <Text className="font-bold text-lg text-white">Generate</Text>
          </Pressable>
        </View>

        {state.type === "reply" && (
          <View className="flex-row items-center gap-2">
            {/* Cancel Reply Button */}
            <Pressable
              onPress={handleReset}
              className="flex-row justify-center items-center px-4 py-2 rounded-full gap-2 flex-1"
              style={{ backgroundColor: "#1C1C3A" }}
            >
              <Text className="font-bold text-lg text-white">Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default Confession;

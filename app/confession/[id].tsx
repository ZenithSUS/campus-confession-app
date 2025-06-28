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
import { useCreateLike, useDeleteLike, useGetLikes } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { commentData } from "@/utils/comments";
import { singlePost } from "@/utils/posts";
import { Comments, CreateComment } from "@/utils/types";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowBigLeftDash,
  Heart,
  Notebook,
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
  Button,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
  } = useGetLikes();
  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useGetComments();
  const {
    data: confessionComments,
    isLoading: confessionCommentsLoading,
    refetch: refetchConfessionComments,
  } = useGetCommentsByConfession(id as string);
  const {
    data: replies,
    isLoading: replyLoading,
    refetch: refetchReplies,
  } = useGetChildrenComments();

  // Local state
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardOffSet, setKeyboardOffSet] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Mutation hooks
  const { mutateAsync: createComment } = useCreateComment();
  const { mutateAsync: createLike } = useCreateLike();
  const { mutateAsync: deleteLike } = useDeleteLike();
  const { mutateAsync: createChildrenComment } = useCreateChildenComment();

  // Form setup
  const { control, handleSubmit, reset } = useForm<CreateComment>({
    defaultValues: {
      confession: "",
      author: "",
      content: "",
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
      replyLoading
    );
  }, [
    confessionLoading,
    likeLoading,
    commentsLoading,
    confessionCommentsLoading,
    replyLoading,
  ]);

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
    reset({
      confession: id as string,
      author: session?.nickname || "",
      content: "",
    });
  }, [dispatch, reset, id, session?.nickname]);

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

  // Comment submission handler
  const submitComment = useCallback(
    async (data: CreateComment) => {
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
      reset({
        confession: id as string,
        author: session.nickname,
        content: "",
      });
    }
  }, [id, session?.nickname, reset]);

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
  if (isAnyLoading) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <ActivityIndicator size="large" color="#1C1C3A" />
        <Text className="mt-2 text-gray-600">Loading confession...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center min-h-screen px-4">
        <Text className="font-bold text-red-600 text-center">
          {error.message}
        </Text>
        <TouchableOpacity
          className="mt-4 px-4 py-2 bg-blue-500 rounded"
          onPress={onRefresh}
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
                <Text className="font-bold">{processedPost.user}</Text>
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
      <View className="gap-2 bg-gray-100 px-4 py-2 rounded-xl">
        <Text className="font-bold">Leave a comment</Text>
        <Controller
          control={control}
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
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
        <TouchableOpacity activeOpacity={0.7}>
          <Button
            title={
              state.type === "comment" ? "Comment" : `Reply to ${state.author}`
            }
            onPress={handleSubmit(submitComment)}
            disabled={isPending}
          />
        </TouchableOpacity>

        {state.type === "reply" && (
          <TouchableOpacity activeOpacity={0.7}>
            <Button title="Cancel" onPress={handleReset} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default Confession;

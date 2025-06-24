import CommentCard from "@/components/comment-card";
import { useComment } from "@/context/comment";
import { useSession } from "@/context/session";
import { useCreateChildenComment } from "@/hooks/useChildrenComment";
import {
  useCreateComment,
  useGetCommentsByConfession,
} from "@/hooks/useComment";
import { useGetConfessionById } from "@/hooks/useConfession";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { CreateComment } from "@/utils/types";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowBigLeftDash,
  Heart,
  Notebook,
  TextIcon,
} from "lucide-react-native";
import React, { useEffect, useState, useTransition } from "react";
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
  const { state, dispatch } = useComment();
  const {
    data: confession,
    isLoading: confessionLoading,
    refetch,
    error,
  } = useGetConfessionById(id as string);
  const { data: comments, isLoading: commentLoading } =
    useGetCommentsByConfession(id as string);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardOffSet, setKeyboardOffSet] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { session } = useSession();
  const { mutateAsync: createComment } = useCreateComment();
  const { mutateAsync: createChildrenComment } = useCreateChildenComment();
  const { control, handleSubmit, reset } = useForm<CreateComment>({
    defaultValues: {
      confession: "",
      author: "",
      content: "",
    },
  });

  const handleReset = () => {
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_TYPE", payload: "comment" });
  };

  const isLiked =
    confession?.likesData.map((like) => like.userId).includes(session.$id) ||
    false;

  const handleLike = async () => {
    try {
      startTransition(async () => {
        if (isLiked) {
          const likeId = confession?.likesData.find(
            (like) => like.userId === session.$id
          )?.$id;

          await useDeleteLike(likeId!);
        } else {
          const data = {
            confessionId: confession?.$id,
            userId: session.$id,
          };
          await useCreateLike(data);
        }
      });
    } catch (error) {}
  };
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
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      dispatch({ type: "SET_ID", payload: id.toString() });
      dispatch({ type: "SET_TYPE", payload: "comment" });
    }
  }, [id]);

  useEffect(() => {
    if (id && session?.nickname) {
      reset({
        confession: id as string,
        author: session.nickname,
        content: "",
      });
    }
  }, [id, session.nickname, reset]);

  const submitComment = (data: CreateComment) => {
    try {
      startTransition(async () => {
        if (state.type === "comment") {
          await createComment(data);
        } else {
          const { content } = data;
          const replyData = {
            content: content,
            userId: session.$id,
            comment: state.id,
            author: session.nickname,
          };
          await createChildrenComment(replyData);
        }
      });
      dispatch({ type: "RESET" });
    } catch (error) {
      console.log(error);
    }
    Keyboard.dismiss();
  };

  const onRefresh = () => {
    setRefreshing(true);
    refetch().then(() => setRefreshing(false));
  };

  if (confessionLoading || commentLoading)
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <ActivityIndicator size={"large"} color={"#1C1C3A"} />
      </View>
    );

  if (!confession || !comments)
    return (
      <View className="flex-1 px-4 py-2">
        <View className="flex items-center justify-center">
          <Text className="font-bold text-lg">Confession not found</Text>
        </View>
      </View>
    );

  if (error)
    return (
      <View className="flex-1 items-center justify-center min-h-screen">
        <Text className="font-bold">{error.message}</Text>;
      </View>
    );

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardOffSet}
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

          <View className="flex col gap-2 shadow p-5 rounded-xl">
            <View className="flex-col gap-2 py-2">
              <Text className="font-bold">{confession.user}</Text>
              <Text>{confession.text}</Text>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-row gap-2 items-center">
                <TouchableOpacity
                  className="flex-row items-center gap-2"
                  onPress={handleLike}
                >
                  <Heart size={18} color={isLiked ? "red" : "#6B7280"} />
                  <Text>{confession.likesLength}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center gap-2">
                  <TextIcon size={18} color="#6B7280" />
                  <Text>{confession.commentsLength}</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-2 items-center">
                <Text>{timeDifference(confession.$createdAt)} ago</Text>
              </View>
            </View>
          </View>

          {comments.length > 0 ? (
            <View className="flex-row gap-2 items-center">
              <Notebook size={18} color="#6B7280" />
              <Text className="font-bold text-lg">Comments</Text>
            </View>
          ) : (
            <Text className="font-bold">No comments yet</Text>
          )}

          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {comments && (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.$id.toString()}
                nestedScrollEnabled={true}
                renderItem={({ item }) => <CommentCard comment={item} />}
              />
            )}
          </ScrollView>

          {/* Leave a comment input */}
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
                      ? `What's on your mind, ${session.nickname}?`
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
                  state.type === "comment"
                    ? "Comment"
                    : `Reply to ${state.author}`
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
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default Confession;

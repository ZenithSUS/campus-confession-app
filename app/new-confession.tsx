import { campuses } from "@/constants/campuses";
import { useSession } from "@/context/session";
import { useCreateConfession } from "@/hooks/useConfession";
import { useRefineConfession } from "@/hooks/useConfessionAI";
import {
  getSingleData,
  storeSingleData,
} from "@/services/react-native-storage";
import { CreateConfession, RefineConfession } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { RelativePathString, router, usePathname } from "expo-router";
import { ArrowBigLeftDash } from "lucide-react-native";
import React, { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Picker from "react-native-picker-select";

const NewConfession = () => {
  const POST_COOLDOWN = 5 * 60 * 1000; // 5 minutes
  const pathname = usePathname();
  const { session, isLoading: isSessionLoading, refreshSession } = useSession();
  const { mutateAsync: refineConfession, error: refineError } =
    useRefineConfession();
  const { mutateAsync: createConfession } = useCreateConfession();
  const [isRefreshing, setRefreshing] = useState(false);
  const [refinedConfession, setRefinedConfession] = useState("");
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isRefined, setRefined] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form for refining confession (AI)
  const refineForm = useForm<RefineConfession>({
    defaultValues: {
      confession: "",
      context: "",
    },
  });

  // Form for posting confession
  const postForm = useForm<CreateConfession>({
    defaultValues: {
      user: session.nickname,
      userId: session.$id,
      text: "",
      campus: "",
    },
  });

  // Check cooldown status on component mount and set up timer
  useEffect(() => {
    checkCooldownStatus();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    let interval: Number;

    if (isInCooldown) {
      interval = setInterval(() => {
        setCooldownTimeLeft((prev) => {
          if (prev <= 1000) {
            setIsInCooldown(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval as number);
    };
  }, [isInCooldown]);

  // Check if user is in cooldown
  const checkCooldownStatus = async () => {
    try {
      const lastPostTimeStr = await getSingleData("lastPostTime");
      if (lastPostTimeStr) {
        const lastPostTime = parseInt(lastPostTimeStr);
        const now = Date.now();
        const timeSinceLastPost = now - lastPostTime;

        if (timeSinceLastPost < POST_COOLDOWN) {
          const timeLeft = POST_COOLDOWN - timeSinceLastPost;
          setIsInCooldown(true);
          setCooldownTimeLeft(timeLeft);
        } else {
          setIsInCooldown(false);
          setCooldownTimeLeft(0);
        }
      }
    } catch (error) {
      console.error("Error checking cooldown status:", error);
    }
  };

  // Format time cooldown
  const formatTime = (ms: number) => {
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Refresh session
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshSession();
      // Also check cooldown status when refreshing
      await checkCooldownStatus();
    } catch (error) {
      console.error("Refresh session error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Submit confession
  const submitConfession = async (data: CreateConfession) => {
    // Check cooldown before submitting
    if (isInCooldown) {
      Alert.alert(
        "Cooldown Active",
        `Please wait ${formatTime(
          cooldownTimeLeft
        )} before posting another confession.`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setApiError(null);
      startTransition(async () => {
        try {
          await createConfession(data);
          queryClient.invalidateQueries({ queryKey: ["confessions"] });

          // Store last post time and activate cooldown
          const now = Date.now();
          await storeSingleData("lastPostTime", now.toString());

          // Set cooldown state
          setIsInCooldown(true);
          setCooldownTimeLeft(POST_COOLDOWN);

          // Show success message
          Alert.alert(
            "Success",
            "Your confession has been posted successfully!",
            [{ text: "OK" }]
          );

          // Only navigate if successful
          if (!isPending) {
            router.replace("/");
          }
        } catch (error) {
          console.error("Submit confession error:", error);
          setApiError("Failed to post confession. Please try again.");

          // Show user-friendly alert
          Alert.alert(
            "Error",
            "Failed to post your confession. Please check your connection and try again.",
            [{ text: "OK" }]
          );
        }
      });
    } catch (error) {
      console.error("Submit confession outer error:", error);
      setApiError("An unexpected error occurred.");
    }
  };

  // Refine confession
  const handleRefine = async (data: RefineConfession) => {
    try {
      setApiError(null);

      startTransition(async () => {
        try {
          const response = await refineConfession({
            confession: data.confession,
            context: data.context,
          });

          if (response?.output) {
            setRefinedConfession(response.output);
            setRefined(true);
            // Auto-fill the post form with refined text
            postForm.setValue("text", response.output);
          } else {
            throw new Error("No data received from AI refinement");
          }
        } catch (error) {
          console.error("Refine error:", error);
          setApiError("Failed to refine confession with AI. Please try again.");

          // Show user-friendly alert
          Alert.alert(
            "AI Refinement Failed",
            "Unable to refine your confession. You can still post it manually.",
            [{ text: "OK" }]
          );
        }
      });
    } catch (error) {
      console.error("Handle refine outer error:", error);
      setApiError("An unexpected error occurred during refinement.");
    }
  };

  // Navigate to another page
  const navigateTo = (path: string) => {
    if (pathname === path) return;
    router.replace(path as RelativePathString);
  };

  // Clear error
  const clearError = () => {
    setApiError(null);
  };

  // If loading session, show loading spinner
  if (isSessionLoading || !session) {
    return (
      <View className="flex-1 justify-center items-center min-h-screen">
        <ActivityIndicator size={"large"} color={"#1C1C3A"} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white px-4 py-2 flex-col gap-2"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header Section */}
      <View className="flex-row items-center justify-between gap-2 py-2">
        <TouchableOpacity className="flex-row items-center gap-2">
          <Text className="font-bold text-lg">New Confession</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center gap-2"
          onPress={() => navigateTo("/")}
        >
          <ArrowBigLeftDash size={22} color="#1C1C3A" />
          <Text>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Cooldown Warning */}
      {isInCooldown && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
          <Text className="font-medium text-yellow-800 text-center">
            ⏰ Cooldown Active: {formatTime(cooldownTimeLeft)} remaining
          </Text>
          <Text className="text-sm text-yellow-600 text-center mt-1">
            Please wait before posting another confession
          </Text>
        </View>
      )}

      {/* Error Display */}
      {(apiError || refineError) && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <Text className="font-medium" style={{ color: "red" }}>
            {apiError || refineError?.message || "An error occurred"}
          </Text>
          <TouchableOpacity className="mt-2 self-end" onPress={clearError}>
            <Text className="font-medium" style={{ color: "#1C1C3A" }}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View className="bg-gray-100 rounded-xl">
        <View className="flex-col gap-2 p-4">
          <View className="flex-row gap-2">
            <Text className="text-lg">Post as:</Text>
            <Text className="font-bold text-lg" numberOfLines={1}>
              {session?.nickname || "Anonymous"}
            </Text>
          </View>

          {/* AI Refine Form */}
          <View className="bg-blue-50 p-3 rounded-xl mb-4">
            <Text className="font-bold text-md mb-2">
              ✨ AI Refine (Optional)
            </Text>
            <Controller
              control={refineForm.control}
              name="confession"
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white px-2 py-2 rounded-xl mb-2"
                  numberOfLines={3}
                  multiline={true}
                  placeholder="Enter your confession to refine with AI..."
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {refineForm.formState.errors.confession && (
              <Text style={{ color: "red", marginBottom: 8 }}>
                Confession text is required for AI refinement
              </Text>
            )}

            <Text className="font-bold text-md mb-2">Context Prompt:</Text>
            <Controller
              control={refineForm.control}
              name="context"
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white px-2 py-2 rounded-xl mb-2"
                  numberOfLines={3}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Enter context prompt..."
                />
              )}
            />

            {refineForm.formState.errors.context && (
              <Text style={{ color: "red", marginBottom: 8 }}>
                Context prompt is required for AI refinement
              </Text>
            )}

            <Pressable
              className="items-center justify-center p-2 rounded-xl"
              style={[styles.AIbutton, isPending && styles.disabledButton]}
              onPress={refineForm.handleSubmit(handleRefine)}
              disabled={isPending}
            >
              <Text className="text-white">
                {isPending ? "Refining..." : "Refine with AI"}
              </Text>
            </Pressable>

            {/* Refined Result */}
            {isRefined && (
              <View className="mt-3">
                <Text className="font-bold text-md mb-2">Refined Result:</Text>
                <TextInput
                  className="bg-white px-2 py-2 rounded-xl"
                  numberOfLines={3}
                  multiline={true}
                  placeholder="Refined Confession..."
                  editable={false}
                  value={refinedConfession}
                />
              </View>
            )}
          </View>

          {/* Post Confession Form */}
          <View className="bg-green-50 p-3 rounded-xl">
            <Text className="font-bold text-md mb-3">📝 Post Confession</Text>

            <Text className="font-bold text-md">Campus</Text>
            <Controller
              control={postForm.control}
              name="campus"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <Picker
                  value={value}
                  style={categoryStyle}
                  onValueChange={onChange}
                  placeholder={{ label: "Select Campus", value: "" }}
                  items={
                    campuses?.map((campus) => ({
                      label: campus.name,
                      value: campus.id,
                    })) || []
                  }
                />
              )}
            />

            {postForm.formState.errors.campus && (
              <Text style={{ color: "red" }}>Campus is required</Text>
            )}

            <Text className="font-bold text-md mt-2">Final Confession</Text>
            <Controller
              control={postForm.control}
              name="text"
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white px-2 py-2 rounded-xl"
                  numberOfLines={5}
                  multiline={true}
                  placeholder="Your final confession text..."
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {postForm.formState.errors.text && (
              <Text style={{ color: "red" }}>Confession text is required</Text>
            )}

            <View className="flex-row items-center gap-2 mt-2">
              <Pressable
                className="items-center justify-center p-2 rounded-xl flex-1"
                style={[
                  styles.postButton,
                  (isPending || isInCooldown) && styles.disabledButton,
                ]}
                onPress={postForm.handleSubmit(submitConfession)}
                disabled={isPending || isInCooldown}
              >
                <Text className="text-white">
                  {isPending
                    ? "Posting..."
                    : isInCooldown
                    ? `Wait ${formatTime(cooldownTimeLeft)}`
                    : "Post Confession"}
                </Text>
              </Pressable>

              <Pressable
                className="items-center justify-center p-2 rounded-xl"
                style={styles.cancelButton}
                onPress={() => navigateTo("/")}
                disabled={isPending}
              >
                <Text className="text-white">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default NewConfession;

const categoryStyle = StyleSheet.create({
  inputAndroid: {
    fontSize: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#1C1C3A",
    paddingHorizontal: 12,
  },
  inputIOS: {
    fontSize: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#1C1C3A",
    paddingHorizontal: 12,
  },
});

const styles = StyleSheet.create({
  AIbutton: {
    backgroundColor: "#1C1C3A",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  postButton: {
    textAlign: "center",
    backgroundColor: "#1C1C3A",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelButton: {
    textAlign: "center",
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

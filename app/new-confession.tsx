import { campuses } from "@/constants/campuses";
import { useSession } from "@/context/session";
import { useCreateConfession } from "@/hooks/useConfession";
import { useGenerateTags, useRefineConfession } from "@/hooks/useConfessionAI";
import {
  getSingleData,
  storeSingleData,
} from "@/services/react-native-storage";
import { CreateConfession, RefineConfession } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { RelativePathString, router, usePathname } from "expo-router";
import { ArrowBigLeftDash } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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

type NewConfession = CreateConfession & {
  inputTag: string;
};

const NewConfession = () => {
  const POST_COOLDOWN = 5 * 60 * 1000; // 5 minutes
  const pathname = usePathname();
  const { session, isLoading: isSessionLoading, refreshSession } = useSession();
  const { mutateAsync: refineConfession, error: refineError } =
    useRefineConfession();
  const { mutateAsync: generateTags } = useGenerateTags();
  const { mutateAsync: createConfession } = useCreateConfession();
  const [tags, setTags] = useState<string[]>([]);
  const [isRefreshing, setRefreshing] = useState(false);
  const [refinedConfession, setRefinedConfession] = useState("");
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

  // Replace useTransition with regular state
  const [isPending, setIsPending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

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
  const postForm = useForm<NewConfession>({
    defaultValues: {
      user: session?.nickname || "",
      userId: session?.$id || "",
      text: "",
      campus: "",
      tags: [],
      inputTag: "",
    },
  });

  // Check cooldown status on component mount and set up timer
  useEffect(() => {
    checkCooldownStatus();
  }, []);

  // Update form defaults when session changes
  useEffect(() => {
    if (session) {
      postForm.setValue("user", session.nickname);
      postForm.setValue("userId", session.$id);
    }
  }, [session, postForm]);

  // Cooldown timer effect
  useEffect(() => {
    let interval: number | null = null;

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
      if (interval) clearInterval(interval);
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
  const submitConfession = async (data: NewConfession) => {
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
      setIsPending(true);

      // Make the tags into an array of strings
      if (data.inputTag && data.inputTag.length > 0) {
        data["tags"] = data.inputTag.split(" ").map((tag) => tag.trim());
      }

      // Don't include the inputTag field in the final data
      const { inputTag, ...finalData } = data;

      await createConfession(finalData);
      queryClient.invalidateQueries({ queryKey: ["confessions"] });

      // Store last post time and activate cooldown
      const now = Date.now();
      await storeSingleData("lastPostTime", now.toString());

      // Set cooldown state
      setIsInCooldown(true);
      setCooldownTimeLeft(POST_COOLDOWN);

      // Show success message
      Alert.alert("Success", "Your confession has been posted successfully!", [
        { text: "OK" },
      ]);

      // Navigate back
      router.replace("/");
    } catch (error) {
      console.error("Submit confession error:", error);
      setApiError("Failed to post confession. Please try again.");

      // Show user-friendly alert
      Alert.alert(
        "Error",
        "Failed to post your confession. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsPending(false);
    }
  };

  // Refine confession
  const handleRefine = async (data: RefineConfession) => {
    try {
      setApiError(null);
      setIsGenerating(true);

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
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Tags for confession
  const handleGenerateTags = async () => {
    try {
      setApiError(null);

      if (!postForm.getValues("text")) {
        setApiError("Please enter a confession before generating tags.");
        return;
      }

      setIsGeneratingTags(true);

      const response = await generateTags({
        input: postForm.getValues("text"),
      });

      if (response?.output) {
        // The output is a array of strings, join them into a single string
        const tags = response.output.join(" ");
        postForm.setValue("inputTag", tags);
        updateTags(tags);
      } else {
        throw new Error("No data received from AI tag generation");
      }
    } catch (error) {
      console.error("Generate tags error:", error);
      setApiError("Failed to generate tags with AI. Please try again.");

      // Show user-friendly alert
      Alert.alert(
        "AI Tag Generation Failed",
        "Unable to generate tags for your confession. You can still post it manually.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // Update tags
  const updateTags = useCallback((tags: string) => {
    const separatedTags = tags.split(" ");
    const filteredTags = separatedTags.filter(
      (tag) => tag.trim() !== "" && tag.length > 0
    );
    setTags(filteredTags);
  }, []);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={"large"} color={"#1C1C3A"} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section */}
        <View className="flex-row items-center justify-between gap-2 py-2">
          <Text className="font-bold text-lg text-gray-800">
            New Confession
          </Text>

          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={() => navigateTo("/")}
          >
            <ArrowBigLeftDash size={22} color="#1C1C3A" />
            <Text className="font-medium text-gray-800">Back</Text>
          </TouchableOpacity>
        </View>

        {/* Cooldown Warning */}
        {isInCooldown && (
          <View className="border border-gray-200 rounded-xl p-3 mb-4">
            <Text className="font-medium text-gray-800 text-center">
              ⏰ Cooldown Active: {formatTime(cooldownTimeLeft)} remaining
            </Text>
            <Text className="text-sm text-gray-600 text-center mt-1">
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
              <Text className="text-lg text-gray-800">Post as:</Text>
              <Text
                className="font-bold text-lg text-gray-800"
                numberOfLines={1}
              >
                {session?.nickname || "Anonymous"}
              </Text>
            </View>

            {/* AI Refine Form */}
            <View className="bg-blue-50 p-3 rounded-xl mb-4">
              <Text className="font-bold text-md mb-2 text-gray-800">
                ✨ AI Refine (Optional)
              </Text>
              <Controller
                control={refineForm.control}
                name="confession"
                rules={{ required: true }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-white px-2 py-2 rounded-xl mb-2 text-gray-800"
                    numberOfLines={3}
                    multiline={true}
                    placeholder="Enter your confession to refine with AI..."
                    placeholderTextColor={"#6B7280"}
                    onBlur={onBlur}
                    value={value}
                    editable={!isGenerating}
                    onChangeText={onChange}
                    textAlignVertical="top"
                  />
                )}
              />

              {refineForm.formState.errors.confession && (
                <Text style={{ color: "red", marginBottom: 8 }}>
                  Confession text is required for AI refinement
                </Text>
              )}

              <Text className="font-bold text-md mb-2 text-gray-800">
                Context Prompt:
              </Text>
              <Controller
                control={refineForm.control}
                name="context"
                rules={{ required: true }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-white px-2 py-2 rounded-xl mb-2 text-gray-800"
                    numberOfLines={3}
                    value={value}
                    onBlur={onBlur}
                    editable={!isGenerating}
                    onChangeText={onChange}
                    placeholder="Enter context prompt..."
                    placeholderTextColor={"#6B7280"}
                    multiline={true}
                    textAlignVertical="top"
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
                style={[styles.AIbutton, isGenerating && { opacity: 0.6 }]}
                onPress={refineForm.handleSubmit(handleRefine)}
                disabled={isGenerating}
              >
                <Text className="text-white">
                  {isGenerating ? "Refining..." : "Refine with AI"}
                </Text>
              </Pressable>

              {/* Refined Result */}
              {isRefined && (
                <View className="mt-3">
                  <Text className="font-bold text-md mb-2 text-gray-800">
                    Refined Result:
                  </Text>
                  <TextInput
                    className="bg-white px-2 py-2 rounded-xl text-gray-800"
                    numberOfLines={3}
                    multiline={true}
                    placeholder="Refined Confession..."
                    placeholderTextColor={"#6B7280"}
                    textAlignVertical="top"
                    editable={false}
                    value={refinedConfession}
                  />
                </View>
              )}
            </View>

            {/* Post Confession Form */}
            <View className="bg-green-50 p-3 rounded-xl">
              <Text
                className="font-bold mb-2 text-gray-800"
                style={{ fontSize: 16 }}
              >
                📝 Post Confession
              </Text>

              <Text className="font-bold mb-2 text-gray-800">Campus</Text>
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

              <Text className="font-bold mb-1 mt-2 text-gray-800">
                Final Confession
              </Text>
              <Controller
                control={postForm.control}
                name="text"
                rules={{ required: true }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-white px-2 py-2 rounded-xl text-gray-800"
                    numberOfLines={5}
                    multiline={true}
                    placeholder="Your final confession text..."
                    placeholderTextColor={"#6B7280"}
                    onBlur={onBlur}
                    value={value}
                    editable={!isPending}
                    onChangeText={onChange}
                    textAlignVertical="top"
                  />
                )}
              />

              <Text className="font-bold mt-2 text-gray-800">Tags</Text>
              <Controller
                control={postForm.control}
                name="inputTag"
                rules={{ required: false }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-white px-2 py-2 rounded-xl text-gray-800"
                    multiline={true}
                    numberOfLines={2}
                    placeholder="Add space for separated tags..."
                    placeholderTextColor={"#6B7280"}
                    onChangeText={(text) => {
                      onChange(text);
                      updateTags(text);
                    }}
                    editable={!isGeneratingTags}
                    onBlur={onBlur}
                    value={value}
                  />
                )}
              />

              {/* Generate Tags */}
              <Pressable
                className="items-center justify-center p-2 rounded-xl mt-2"
                style={[styles.tagButton, isGeneratingTags && { opacity: 0.6 }]}
                onPress={handleGenerateTags}
                disabled={isGeneratingTags}
              >
                <Text className="text-white">
                  {isGeneratingTags ? "Generating..." : "Generate Tags"}
                </Text>
              </Pressable>

              {tags.length > 0 && (
                <View
                  className="flex-row gap-2 mt-2"
                  style={{ flexWrap: "wrap" }}
                >
                  {tags.map((tag, index) => (
                    <View
                      key={`${tag}-${index}`}
                      className="items-center justify-center p-2 rounded-xl"
                      style={styles.tags}
                    >
                      <Text className="text-gray-800">#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {postForm.formState.errors.text && (
                <Text style={{ color: "red" }}>
                  Confession text is required
                </Text>
              )}

              <View className="flex-row items-center gap-2 mt-2">
                <Pressable
                  className="items-center justify-center p-2 rounded-xl flex-1"
                  style={[
                    styles.postButton,
                    (isPending || isInCooldown) && { opacity: 0.6 },
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
    </KeyboardAvoidingView>
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: Dimensions.get("window").height,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollViewContent: {
    padding: 8,
    gap: 8,
    paddingBottom: 20,
  },
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
  tagButton: {
    backgroundColor: "#1C1C3A",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tags: {
    backgroundColor: "skyblue",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});

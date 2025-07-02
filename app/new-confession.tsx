import { campuses } from "@/constants/campuses";
import { useSession } from "@/context/session";
import { useCreateConfession } from "@/hooks/useConfession";
import { useRefineConfession } from "@/hooks/useConfessionAI";
import { CreateConfession, RefineConfession } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { RelativePathString, router, usePathname } from "expo-router";
import { ArrowBigLeftDash } from "lucide-react-native";
import React, { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Picker from "react-native-picker-select";

const NewConfession = () => {
  const pathname = usePathname();
  const { session, isLoading: isSessionLoading } = useSession();
  const { mutateAsync: refineConfession, error: refineError } =
    useRefineConfession();
  const [refinedConfession, setRefinedConfession] = useState("");
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
      user: session?.nickname || "",
      userId: session?.$id || "",
      text: "",
      campus: "",
    },
  });

  const submitConfession = async (data: CreateConfession) => {
    try {
      setApiError(null);
      startTransition(async () => {
        try {
          await useCreateConfession(data);
          queryClient.invalidateQueries({ queryKey: ["confessions"] });

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

  const navigateTo = (path: string) => {
    if (pathname === path) return;
    router.replace(path as RelativePathString);
  };

  const clearError = () => {
    setApiError(null);
  };

  if (isSessionLoading) {
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
                  placeholder={{ label: "Select Campus", value: null }}
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
                style={[styles.postButton, isPending && styles.disabledButton]}
                onPress={postForm.handleSubmit(submitConfession)}
                disabled={isPending}
              >
                <Text className="text-white">
                  {isPending ? "Posting..." : "Post Confession"}
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

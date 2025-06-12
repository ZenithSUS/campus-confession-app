import { campuses } from "@/constants/campuses";
import { useCreateConfession } from "@/hooks/useConfession";
import { CreateConfession } from "@/utils/types";
import { RelativePathString, router, usePathname } from "expo-router";
import { ArrowBigLeftDash } from "lucide-react-native";
import React, { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Picker from "react-native-picker-select";

const NewConfession = () => {
  const pathname = usePathname();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateConfession>();
  const { mutateAsync: createConfession } = useCreateConfession();
  const submitConfession = (data: CreateConfession) => {
    data["user"] = "John Doe";

    startTransition(() => {
      createConfession(data);
    });

    navigateTo("/");
  };

  const [isPending, startTransition] = useTransition();

  const navigateTo = (path: string) => {
    if (pathname === path) return;
    router.replace(path as RelativePathString);
  };

  return (
    <View className="flex-1 bg-white px-4 py-2 flex-col gap-2">
      {/* Header Section */}
      <View className="flex-row items-center justify-between gap-2">
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

      {/* Content */}
      <View className="bg-gray-100 rounded-xl">
        <View className="flex-col gap-2 p-4">
          <Controller
            control={control}
            name="campus"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <Picker
                value={value}
                style={categoryStyle}
                onValueChange={onChange}
                placeholder={{ label: "Category", value: null }}
                items={campuses.map((campus) => ({
                  label: campus.name,
                  value: campus.id,
                }))}
              />
            )}
          />

          {errors.campus && (
            <Text style={{ color: "red" }}>Category is required</Text>
          )}

          <Text className="font-bold text-lg">Confession</Text>
          <Controller
            control={control}
            name="text"
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-white px-3 py-2 rounded-xl"
                numberOfLines={5}
                multiline={true}
                placeholder="Confession..."
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {errors.text && (
            <Text style={{ color: "red" }}>Confession is required</Text>
          )}

          <View className="flex-row items-center gap-2 py-2">
            <TouchableOpacity activeOpacity={0.7}>
              <Button
                title="Post Anonymously"
                disabled={isPending}
                onPress={handleSubmit(submitConfession)}
              />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <Button
                title="Cancel"
                onPress={() => navigateTo("/")}
                disabled={isPending}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default NewConfession;

const categoryStyle = StyleSheet.create({
  inputAndroid: {
    fontSize: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#1C1C3A",
  },
});

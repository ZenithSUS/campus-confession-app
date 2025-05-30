import { categories } from "@/constants/category";
import { RelativePathString, router, usePathname } from "expo-router";
import { ArrowBigLeftDash } from "lucide-react-native";
import React, { useState } from "react";
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
  const [category, setCategory] = useState("");
  const pathname = usePathname();

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
          <Picker
            value={category}
            style={categoryStyle}
            onValueChange={(value) => setCategory(value)}
            placeholder={{ label: "Category", value: null }}
            items={categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
          />

          <Text className="font-bold text-lg">Confession</Text>
          <TextInput
            className="bg-white px-3 py-2 rounded-xl"
            numberOfLines={5}
            multiline={true}
            placeholder="Confession..."
          />

          <View className="flex-row  items-center gap-2 py-2">
            <TouchableOpacity activeOpacity={0.7}>
              <Button
                title="Post Anonymously"
                onPress={() => console.log(category)}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo("/")}
            >
              <Button title="Cancel" />
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

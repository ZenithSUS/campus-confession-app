import { icons } from "@/constants/icons";
import React from "react";
import { Image, ImageSourcePropType, TextInput, View } from "react-native";

const Searchbar = () => {
  return (
    <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-full flex-1">
      <Image
        source={icons.search as ImageSourcePropType}
        resizeMode="contain"
        tintColor="#A8Bbff"
        style={{ width: 18, height: 18 }}
      />
      <TextInput
        placeholder="Search confessions..."
        placeholderTextColor="#6B7280"
        className="ml-2 flex-1 text-sm"
      />
    </View>
  );
};

export default Searchbar;

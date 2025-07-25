import { icons } from "@/constants/icons";
import React from "react";
import { Image, ImageSourcePropType, TextInput, View } from "react-native";

const Searchbar = ({ onSearch }: { onSearch: (query: string) => void }) => {
  return (
    <View className="flex-1">
      <View className="flex-row items-center bg-gray-100 pl-2 py-2 rounded-full">
        <Image
          source={icons.search as ImageSourcePropType}
          resizeMode="contain"
          tintColor="#A8Bbff"
          style={{ width: 18, height: 18 }}
        />
        <TextInput
          placeholder="Search confessions..."
          placeholderTextColor="#6B7280"
          className="flex-1 text-sm px-2 py-2 outline-none text-gray-800"
          onChangeText={(query) => onSearch(query)}
        />
      </View>
    </View>
  );
};

export default Searchbar;

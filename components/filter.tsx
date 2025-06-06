import { campuses } from "@/constants/campuses";
import { ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";

export const Filter = () => {
  const [filter, setFilter] = useState("All");

  return (
    <View className="w-full p-3 rounded-xl">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-lg mr-2">Filter:</Text>
        <View className="flex-1 relative">
          <RNPickerSelect
            value={filter}
            onValueChange={(value) => setFilter(value)}
            items={campuses.map((campus) => ({
              label: campus.name,
              value: campus.id,
            }))}
            style={styles}
            placeholder={{ label: "All", value: "All" }}
            useNativeAndroidPickerStyle={false}
            Icon={() => <ChevronDown size={18} color="#6B7280" />}
          />
        </View>
      </View>
    </View>
  );
};

export default Filter;

const styles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#1C1C3A",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#1C1C3A",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingRight: 30,
  },
  iconContainer: {
    top: Platform.OS === "android" ? 14 : 12,
    right: 12,
    position: "absolute",
    pointerEvents: "none",
  },
});

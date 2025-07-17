import { campuses } from "@/constants/campuses";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";

interface FilterProps {
  onFilter: (category: string) => void;
  category: string;
}

export const Filter = ({ onFilter, category }: FilterProps) => {
  return (
    <View>
      <RNPickerSelect
        value={category}
        onValueChange={(value) => onFilter(value)}
        items={campuses.map((campus) => ({
          label: campus.name,
          value: campus.id,
        }))}
        style={styles}
        placeholder={{ label: "All", value: "All" }}
        useNativeAndroidPickerStyle={false}
      />
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

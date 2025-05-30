import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

const Confession = () => {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Confession</Text>
    </View>
  );
};

export default Confession;

import { timeDifference } from "@/utils/calculate-time";
import { Confessions } from "@/utils/types";
import { Link } from "expo-router";
import { EyeIcon, Heart, TextIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

const ConfessionCard = ({ confession }: { confession: Confessions }) => {
  return (
    <View className="flex-1 gap-2 p-4">
      <View className="flex-col bg-gray-100 shadow gap-2 p-4 rounded-xl">
        <Text className="font-bold">{confession.user}</Text>
        <Text>{confession.text}</Text>

        {/* Actions */}
        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-2">
              <Heart size={18} />
              <Text>{confession.likes}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <TextIcon size={18} />
              <Text>{confession.comments}</Text>
            </View>
          </View>
        </View>
        {/* Time */}
        <View className="flex-row justify-between items-center">
          <Link href={`/confession/${confession.id}`}>
            <View className="flex-row items-center gap-2">
              <EyeIcon size={18} />
              <Text>View</Text>
            </View>
          </Link>
          <Text>{timeDifference(confession.timestamp)} ago</Text>
        </View>
      </View>
    </View>
  );
};

export default ConfessionCard;

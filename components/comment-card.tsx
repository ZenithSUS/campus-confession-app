import { timeDifference } from "@/utils/calculate-time";
import { Comments } from "@/utils/types";
import { Heart, TextIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

const CommentCard = ({ comment }: { comment: Comments }) => {
  return (
    <View className="flex-1 p-4">
      <View className="flex-col rounded-xl shadow gap-2 p-4">
        <Text className="font-bold">{comment.author}</Text>
        <Text className="py-2">{comment.content}</Text>

        <View className="flex-row items-center rounded-xl justify-between">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-2 cursor-pointer">
              <Heart size={18} />
              <Text>{comment.likes}</Text>
            </View>

            <View className="flex-row items-center gap-2 cursor-pointer">
              <TextIcon size={18} />
              <Text>{comment.childComments}</Text>
            </View>
          </View>
          <Text>{timeDifference(comment.$createdAt)} ago</Text>
        </View>
      </View>
    </View>
  );
};

export default CommentCard;

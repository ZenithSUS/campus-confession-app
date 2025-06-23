import { useSession } from "@/context/session";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { Confessions } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { Heart, TextIcon } from "lucide-react-native";
import React, { useTransition } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const ConfessionCard = ({ confession }: { confession: Confessions }) => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const isAuthor = confession.user === session.nickname;
  const isLiked = confession.likesData
    .map((like) => like.userId)
    .includes(session.$id);

  const handleLike = () => {
    try {
      if (isLiked) {
        const likeId = confession.likesData.find(
          (like) => like.userId === session.$id
        )?.$id;
        startTransition(async () => {
          await useDeleteLike(likeId!);
        });
      } else {
        const data = {
          confessionId: confession.$id,
          userId: session.$id,
        };
        startTransition(async () => {
          await useCreateLike(data);
        });
      }
      queryClient.invalidateQueries({ queryKey: ["confessions"] });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 px-2 py-4">
      <View className="flex-col shadow gap-2 p-5 rounded-xl">
        <View className="flex-row justify-between items-center">
          <Text className="font-bold">
            {isAuthor ? `You (${confession.user})` : confession.user}:{" "}
            <Text className="font-normal">
              {timeDifference(confession.$createdAt)} ago
            </Text>
          </Text>

          <Text>{confession.campus}</Text>
        </View>

        <Link href={`/confession/${confession.$id}`} className="py-2">
          <Text numberOfLines={2}>{confession.text}</Text>
        </Link>

        {/* Actions */}
        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={handleLike}
              disabled={isPending}
            >
              <Heart
                size={18}
                color={isPending ? "gray" : isLiked ? "red" : "#6b7280"}
              />
              <Text>{confession.likesLength}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => router.push(`/confession/${confession.$id}`)}
            >
              <TextIcon
                size={18}
                className="cursor-pointer disabled:opacity-50"
              />
              <Text>{confession.commentsLength}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ConfessionCard;

import { useSession } from "@/context/session";
import { useCreateLike, useDeleteLike } from "@/hooks/useLike";
import { timeDifference } from "@/utils/calculate-time";
import { ShowConfessions } from "@/utils/types";
import { Link, router } from "expo-router";
import { Heart, TextIcon } from "lucide-react-native";
import React, { useMemo, useTransition } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const ConfessionCard = ({ confession }: { confession: ShowConfessions }) => {
  const { session } = useSession();
  const [isPending, startTransition] = useTransition();
  const { mutateAsync: CreateLike } = useCreateLike();
  const { mutateAsync: DeleteLike } = useDeleteLike();
  const isAuthor = confession.user === session.nickname;

  const isLiked = useMemo(() => {
    return confession.likesData.some((like) => like.userId === session.$id);
  }, [confession.likesData, session.$id, useCreateLike, useDeleteLike]);

  // Handle like
  const handleLike = () => {
    try {
      startTransition(async () => {
        try {
          if (isLiked) {
            const likeId = confession.likesData.find(
              (like) => like.userId === session.$id
            )?.$id;
            await DeleteLike({
              likeId: likeId!,
              confessionId: confession.$id,
            });
          } else {
            const data = {
              confessionId: confession.$id,
              userId: session.$id,
            };
            await CreateLike(data);
          }
        } catch (error) {
          console.log(error);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 px-2 py-4">
      <View className="flex-col shadow gap-2 p-5 rounded-xl">
        <View className="flex-row justify-between items-center">
          <Text className="font-bold" numberOfLines={1}>
            {isAuthor ? `You (${confession.user})` : confession.user}:{" "}
            <Text className="font-normal">
              {timeDifference(confession.$createdAt)} ago
            </Text>
          </Text>

          <Text>{confession.campus}</Text>
        </View>

        {/* Tags */}
        {confession.tags.length > 0 && (
          <View
            className="flex-row items-center gap-2"
            style={{ flexWrap: "wrap" }}
          >
            {confession.tags.map((tag, index) => (
              <Text
                key={index}
                className="px-2 py-1 rounded-full font-bold bg-gray-100 text-xs"
              >
                #{tag}
              </Text>
            ))}
          </View>
        )}

        <Link href={`/confession/${confession.$id}`} className="py-2">
          <Text numberOfLines={3}>{confession.text}</Text>
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

export default React.memo(ConfessionCard);

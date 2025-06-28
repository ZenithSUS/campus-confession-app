import { ChildrenComment, Likes } from "./types";

export const replies = (replies: ChildrenComment[], likes: Likes[]) => {
  return replies.map((reply) => {
    const likesData = likes.filter((like) => {
      if (like?.childrenCommentId?.$id) {
        return like.childrenCommentId.$id === reply.$id;
      }
    });

    return {
      ...reply,
      likesLength: likesData.length,
      likesData,
    };
  });
};

import { ChildrenComment, Comments, Likes } from "./types";

export const commentData = (
  comments: Comments[],
  likes: Likes[],
  replies: ChildrenComment[]
) => {
  return comments.map((comment) => {
    const likesData = likes.filter((like) => {
      if (like?.commentId?.$id) {
        return like.commentId.$id === comment.$id;
      }
    });
    const repliesData = replies.filter((reply) => {
      if (reply?.comment?.$id) {
        return reply.comment.$id === comment.$id;
      }
    });
    return {
      ...comment,
      likesLength: likesData.length,
      repliesLength: repliesData.length,
      likesData,
      repliesData,
    };
  });
};

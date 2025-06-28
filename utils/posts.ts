import { Comments, Confessions, Likes } from "./types";

export const posts = (
  confessions: Confessions[],
  likes: Likes[],
  comments: Comments[]
) => {
  return confessions.map((confession) => {
    const likesData = likes.filter((like) => {
      if (like?.confessionId?.$id) {
        return like.confessionId.$id === confession.$id;
      }
    });
    const commentsData = comments.filter((comment) => {
      if (comment?.confession?.$id) {
        return comment.confession.$id === confession.$id;
      }
    });
    return {
      ...confession,
      likesLength: likesData.length,
      commentsLength: commentsData.length,
      likesData,
      commentsData,
    };
  });
};

export const singlePost = (
  post: Confessions,
  likes: Likes[],
  comments: Comments[]
) => {
  const likesData = likes.filter((like) => {
    if (like?.confessionId?.$id) {
      return like.confessionId.$id === post.$id;
    }
  });

  const commentsData = comments.filter((comment) => {
    if (comment?.confession?.$id) {
      return comment.confession.$id === post.$id;
    }
  });
  return {
    ...post,
    likesLength: likesData.length,
    commentsLength: commentsData.length,
    likesData,
    commentsData,
  };
};

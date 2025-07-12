export type Session = {
  $id: string;
  nickname: string;
};

export type RefineConfession = {
  confession: string;
  context: string;
};

export type User = {
  $id: string;
  name: string;
};

export type Confessions = {
  $id: string;
  campus: string;
  text: string;
  $createdAt: string;
  user: string;
  tags: string[];
};

export type ShowConfessions = Confessions & {
  likesData: Likes[];
  commentsData: Comments[];
  likesLength: number;
  commentsLength: number;
};

export type CreateConfession = {
  campus: string;
  text: string;
  user: string;
  userId: string;
  tags: string[];
};

export type Likes = {
  $id: string;
  confessionId: Confessions;
  childrenCommentId: ChildrenComment;
  commentId: Comments;
  userId: string;
  isLiked: boolean;
  likesLength: number;
};

export type CreateLike = {
  confessionId?: string;
  childrenCommentId?: string;
  commentId?: string;
  userId: string;
};

export type CreateLikeReply = {
  childrenCommentId: string;
  userId: string;
};

export type Comments = {
  $id: string;
  confession: Confessions;
  content: string;
  $createdAt: string;
  author: string;
  likesLength: number;
  likesData: Likes[];
  repliesLength: number;
  repliesData: ChildrenComment[];
};

export type CreateComment = {
  content: string;
  confession: string;
  author: string;
  userId: string;
};

export type ChildrenComment = {
  $id: string;
  $createdAt: string;
  userId: string;
  author: string;
  comment: Comments;
  content: string;
  likesLength: number;
  likesData: Likes[];
};

export type CreateChildrenComment = {
  userId: string;
  comment: string;
  content: string;
};

export type ShowChildrenComment = ChildrenComment & {
  author: string;
  likesLength: number;
  likesData: Likes[];
};

export type CreateLikeParams = Omit<CreateLike, "userId"> & { userId: string };

export type DeleteLikeParams = {
  likeId: string;
  confessionId?: string;
  childrenCommentId?: string;
  commentId?: string;
};

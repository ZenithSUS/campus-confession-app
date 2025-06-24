export type Session = {
  $id: string;
  nickname: string;
};

export type Confessions = {
  $id: string;
  campus: string;
  text: string;
  $createdAt: string;
  likesData: Likes[];
  commentsData: Comments[];
  likesLength: number;
  commentsLength: number;
  user: string;
};

export type CreateConfession = {
  campus: string;
  text: string;
  user: string;
  userId: string;
};

export type Likes = {
  $id: string;
  confessionId: string;
  commentId: string;
  userId: string;
};

export type CreateLike = Partial<Likes>;

export type Comments = {
  $id: string;
  confessionId: string;
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
};

export type ChildrenComment = {
  $id: string;
  $createdAt: string;
  userId: string;
  author: string;
  commentId: string;
  content: string;
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

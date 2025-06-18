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
  userId: string;
};

export type CreateLike = Omit<Likes, "$id">;

export type Comments = {
  $id: string;
  confessionId: string;
  content: string;
  $createdAt: string;
  author: string;
  likes: number;
  childComments: number;
};

export type CreateComment = {
  content: string;
  confession: string;
  author: string;
};

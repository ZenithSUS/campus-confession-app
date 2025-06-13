export type Session = {
  $id: string;
  nickname: string;
}

export type Confessions = {
  $id: string;
  campus: string;
  text: string;
  $createdAt: string;
  likes: number;
  comments: number;
  user: string;
};

export type CreateConfession = {
  campus: string;
  text: string;
  user: string;
  userId: string;
};

export type Comments = {};

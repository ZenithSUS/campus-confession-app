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
};

export type Comments = {};

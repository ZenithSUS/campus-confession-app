import axiosClient from "@/services/axios";

export const getComments = () => axiosClient.get("/comments");

export const getCommentsByConfession = (id: string) =>
  axiosClient.get(`/comments/${id}`);

export const deleteComment = (id: string) =>
  axiosClient.delete(`/comments/${id}`);

export const createComment = (data: any) => axiosClient.post("/comments", data);

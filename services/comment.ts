import axiosClient from "@/services/axios";

export const getComments = (id: string) => axiosClient.get(`/comments/${id}`);

export const getComment = (id: string) =>
  axiosClient.get(`/comments/confession/${id}`);

export const deleteComment = (id: string) =>
  axiosClient.delete(`/comments/${id}`);

export const createComment = (data: any) => axiosClient.post("/comments", data);

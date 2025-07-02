import axiosClient from "@/services/axios";
import { CreateLike } from "@/utils/types";

export const createLike = (data: CreateLike) =>
  axiosClient.post("/likes", data);

export const getLikesByConfession = (id: string) =>
  axiosClient.get(`/likes/confession/${id}`);

export const getLikesByComments = (id: string) =>
  axiosClient.get(`/likes/comments/${id}`);

export const getLikesByChildrenComment = (id: string) =>
  axiosClient.get(`/likes/child-comments/${id}`);

export const deleteLike = (id: string) => axiosClient.delete(`/likes/${id}`);

export const getLikes = () => {
  try {
    return axiosClient.get("/likes");
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

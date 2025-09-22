import axiosClient from "@/services/axios";
import { CreateLike } from "@/utils/types";

export const createLike = (data: CreateLike, signal?: AbortSignal) => {
  try {
    return axiosClient.post("/likes", data, { signal, timeout: 10000 });
  } catch (error) {
    throw error;
  }
};

export const getLikesByConfession = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.get(`/likes/confession/${id}`, {
      signal,
      timeout: 10000,
    });
  } catch (error) {
    throw error;
  }
};

export const getLikesByComments = (id: string) =>
  axiosClient.get(`/likes/comments/${id}`);

export const getLikesByChildrenComment = (id: string) =>
  axiosClient.get(`/likes/child-comments/${id}`);

export const deleteLike = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.delete(`/likes/${id}`, { signal, timeout: 10000 });
  } catch (error) {
    throw error;
  }
};

export const getLikes = () => {
  try {
    return axiosClient.get("/likes");
  } catch (error) {
    throw error;
  }
};

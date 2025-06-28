import { CreateLike } from "@/utils/types";
import axiosClient from "./axios";

export const createLike = (data: CreateLike) =>
  axiosClient.post("/likes", data);

export const getLikesByConfession = (id: string) =>
  axiosClient.get(`/likes/confession/${id}`);

export const getLikesByComments = (id: string) =>
  axiosClient.get(`/likes/comments/${id}`);

export const getLikesByChildrenComment = (id: string) =>
  axiosClient.get(`/likes/child-comments/${id}`);

export const deleteLike = (id: string) => axiosClient.delete(`/likes/${id}`);

export const getLikes = () => axiosClient.get("/likes");

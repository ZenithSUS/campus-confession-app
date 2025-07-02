import axiosClient from "@/services/axios";
import { CreateChildrenComment } from "@/utils/types";

export const getChildrenComments = () => axiosClient.get("/child-comments");

export const getChildrenCommentById = (id: string) =>
  axiosClient.get(`/child-comments/${id}`);

export const createChildrenComment = (data: CreateChildrenComment) =>
  axiosClient.post(`/child-comments`, data);

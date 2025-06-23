import { CreateChildrenComment } from "@/utils/types";
import axiosClient from "./axios";

export const getChildrenCommentById = (id: string) =>
  axiosClient.get(`/child-comments/${id}`);

export const createChildrenComment = (data: CreateChildrenComment) =>
  axiosClient.post(`/child-comments`, data);

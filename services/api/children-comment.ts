import axiosClient from "@/services/axios";
import { CreateChildrenComment } from "@/utils/types";

export const getChildrenComments = (signal?: AbortSignal) => {
  try {
    return axiosClient.get("/child-comments", { signal, timeout: 10000 });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getChildrenCommentById = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.get(`/child-comments/${id}`, { signal, timeout: 10000 });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getChildrenCommentPaginatedByParent = (
  id: string,
  page: number,
  signal?: AbortSignal
) => {
  try {
    return axiosClient.get(`/child-comments/comment/${id}/pagination/${page}`, {
      signal,
      timeout: 10000,
    });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const createChildrenComment = (data: CreateChildrenComment) => {
  try {
    return axiosClient.post("/child-comments", data);
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

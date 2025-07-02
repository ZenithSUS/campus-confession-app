import axiosClient from "@/services/axios";

export const getComments = (signal?: AbortSignal) => {
  try {
    return axiosClient.get("/comments", { signal, timeout: 10000 });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getCommentsByConfession = (id: string) =>
  axiosClient.get(`/comments/${id}`);

export const deleteComment = (id: string) =>
  axiosClient.delete(`/comments/${id}`);

export const createComment = (data: any) => axiosClient.post("/comments", data);

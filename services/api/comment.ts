import axiosClient from "@/services/axios";

export const getComments = (signal?: AbortSignal) => {
  try {
    return axiosClient.get("/comments", { signal, timeout: 10000 });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getCommentsByConfession = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.get(`/comments/${id}`, { signal, timeout: 10000 });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getCommentsPaginationByConfession = (
  id: string,
  page: number,
  signal?: AbortSignal
) => {
  try {
    return axiosClient.get(`/comments/confession/${id}/pagination/${page}`, {
      signal,
      timeout: 10000,
    });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const deleteComment = (id: string) => {
  try {
    return axiosClient.delete(`/comments/${id}`);
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const createComment = (data: any) => {
  try {
    return axiosClient.post("/comments", data);
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

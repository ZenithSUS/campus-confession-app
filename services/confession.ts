import axiosClient from "@/services/axios";

export const getConfessions = async () => axiosClient.get("/confessions");

export const getConfession = (id: string) =>
  axiosClient.get(`/confessions/${id}`);

export const deleteConfession = (id: string) =>
  axiosClient.delete(`/confessions/${id}`);

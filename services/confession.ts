import axiosClient from "@/services/axios";
import { CreateConfession } from "@/utils/types";

export const getConfessions = async () => axiosClient.get("/confessions");

export const getConfession = (id: string) =>
  axiosClient.get(`/confessions/${id}`);

export const createConfession = (data: CreateConfession) =>
  axiosClient.post("/confessions", data);

export const deleteConfession = (id: string) =>
  axiosClient.delete(`/confessions/${id}`);

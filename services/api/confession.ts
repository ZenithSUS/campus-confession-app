import axiosClient from "@/services/axios";
import { CreateConfession, ShowConfessions } from "@/utils/types";
import { AxiosResponse } from "axios";

export const getConfessions = async (
  signal?: AbortSignal
): Promise<AxiosResponse<ShowConfessions[]>> => {
  try {
    const response = await axiosClient.get("/confessions", {
      signal,
      timeout: 10000,
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch confessions");
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export const getConfession = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.get(`/confessions/${id}`, { signal, timeout: 10000 });
  } catch (error) {
    throw error;
  }
};

export const getConfessionPagination = (page: number, signal?: AbortSignal) => {
  try {
    return axiosClient.get(`/confessions/pagination/${page}`, {
      signal,
      timeout: 30000,
    });
  } catch (error) {
    throw error;
  }
};

export const getConfessionByQuery = (
  query: string,
  page: number,
  signal?: AbortSignal
) => {
  try {
    return axiosClient.get(`/confessions/query/${query}/page/${page}`, {
      signal,
      timeout: 10000,
    });
  } catch (error) {
    throw error;
  }
};

export const getTopConfessions = (signal?: AbortSignal) => {
  try {
    return axiosClient.get("/confessions/top", { signal, timeout: 10000 });
  } catch (error) {
    throw error;
  }
};

export const createConfession = (
  data: CreateConfession,
  signal?: AbortSignal
) => {
  try {
    return axiosClient.post("/confessions", data, { signal, timeout: 10000 });
  } catch (error) {
    throw error;
  }
};

export const deleteConfession = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.delete(`/confessions/${id}`, { signal, timeout: 10000 });
  } catch (error) {
    throw error;
  }
};

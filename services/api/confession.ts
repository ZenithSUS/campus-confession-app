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
  } catch (error: any) {
    console.error(
      "API Error:",
      error?.response?.data || error.message || error
    );
    throw error;
  }
};

export const getConfession = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.get(`/confessions/${id}`, { signal, timeout: 10000 });
  } catch (error) {
    console.error("API Error:", error);
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
    console.error("API Error:", error);
    throw error;
  }
};

export const deleteConfession = (id: string, signal?: AbortSignal) => {
  try {
    return axiosClient.delete(`/confessions/${id}`, { signal, timeout: 10000 });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

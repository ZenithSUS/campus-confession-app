import axiosClient from "@/services/axios";
import { RefineConfession } from "@/utils/types";

export const refineConfession = async (
  data: RefineConfession,
  signal?: AbortSignal
) => {
  try {
    const response = await axiosClient.post("/mistral/refineConfession", data, {
      signal,
      timeout: 10000,
    });
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const generateComment = async (
  data: { input: string },
  signal?: AbortSignal
) => {
  try {
    const response = await axiosClient.post("/mistral/generateComment", data, {
      signal,
      timeout: 10000,
    });
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

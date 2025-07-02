import axiosClient from "@/services/axios";
import { RefineConfession } from "@/utils/types";

export const refineConfession = async (data: RefineConfession) => {
  try {
    const response = await axiosClient.post("/mistral/refineConfession", data);
    return response;
  } catch (error) {
    console.error("API Error:", error);
    // Re-throw the error so it can be handled by the hook
    throw error;
  }
};

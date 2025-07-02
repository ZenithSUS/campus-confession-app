import { refineConfession } from "@/services/api/confession-ai";
import { axiosError } from "@/utils/axios-error";
import { RefineConfession } from "@/utils/types";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const useRefineConfession = (): UseMutationResult<
  any,
  Error,
  RefineConfession,
  unknown
> => {
  return useMutation({
    mutationFn: async (input: RefineConfession) => {
      try {
        const response = await refineConfession(input);
        return response?.data;
      } catch (error) {
        const err = error as AxiosError;
        // Handle different types of errors
        return axiosError(err);
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });
};

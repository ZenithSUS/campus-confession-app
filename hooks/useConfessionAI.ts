import {
  generateComment,
  generateTags,
  refineConfession,
} from "@/services/api/confession-ai";
import { networkAxiosError } from "@/utils/axios-error";
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
        return networkAxiosError(err);
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGenerateComment = () => {
  return useMutation({
    mutationFn: async (input: { input: string }) => {
      try {
        const response = await generateComment(input);
        return response?.data;
      } catch (error) {
        const err = error as AxiosError;
        return networkAxiosError(err);
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGenerateTags = () => {
  return useMutation({
    mutationFn: async (input: { input: string }) => {
      try {
        const response = await generateTags(input);
        return response?.data;
      } catch (error) {
        const err = error as AxiosError;
        return networkAxiosError(err);
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

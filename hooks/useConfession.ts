import {
  createConfession,
  deleteConfession,
  getConfession,
  getConfessions,
} from "@/services/api/confession";
import { networkAxiosError, retryAxiosError } from "@/utils/axios-error";
import { Confessions, CreateConfession, ShowConfessions } from "@/utils/types";
import {
  QueryObserverResult,
  UseBaseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

export const useGetConfession = (): QueryObserverResult<ShowConfessions[]> => {
  return useQuery<ShowConfessions[]>({
    queryKey: ["confessions"],
    queryFn: async ({ signal }) => {
      try {
        // React Query automatically provides signal for timeout/cancellation
        const response = await getConfessions(signal);
        return response.data;
      } catch (error) {
        const err = error as AxiosError;
        throw networkAxiosError(err);
      }
    },
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on timeout or network errors after 2 attempts
      if (error instanceof Error) {
        retryAxiosError(failureCount, error as AxiosError);
        if (error.message.includes("Network Error")) {
          return false;
        }
      }

      return failureCount < 2; // Normal retry logic for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

export const useGetConfessionById = (
  id: string
): QueryObserverResult<ShowConfessions> => {
  return useQuery<ShowConfessions>({
    queryKey: ["confession", id],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await getConfession(id, signal);
        return data;
      } catch (error) {
        const err = error as AxiosError;
        throw networkAxiosError(err, id);
      }
    },
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (
          error.message.includes("timeout") ||
          error.message.includes("not responding") ||
          error.message.includes("connect to server")
        ) {
          return failureCount < 1; // Only retry once for timeouts
        }

        if (error.message.includes("Network Error")) {
          return false;
        }
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

export const useCreateConfession = (): UseBaseMutationResult<
  AxiosResponse<CreateConfession>,
  unknown,
  CreateConfession
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateConfession) => {
      try {
        // React Query automatically provides signal for timeout/cancellation
        return await createConfession(data);
      } catch (error) {
        const err = error as AxiosError;

        // Handle timeout and network errors
        if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
          throw new Error("Server is not responding. Please try again.");
        }

        if (
          err.code === "ERR_NETWORK" ||
          err.message.includes("Network Error")
        ) {
          throw new Error(
            "Unable to connect to server. Check your connection."
          );
        }

        throw new Error("Failed to create confession");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["confessions"] });
    },
    retry: 1, // Retry once on failure
  });
};

export const useDeleteConfession = (): UseBaseMutationResult<
  AxiosResponse<Confessions>,
  unknown,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await deleteConfession(id);
      } catch (error) {
        const err = error as AxiosError;

        // Handle timeout and network errors
        if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
          throw new Error("Server is not responding. Please try again.");
        }

        if (
          err.code === "ERR_NETWORK" ||
          err.message.includes("Network Error")
        ) {
          throw new Error(
            "Unable to connect to server. Check your connection."
          );
        }

        throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["confessions"] }),
    retry: 1, // Retry once on failure
    onError: (error) => {
      if (
        !(
          error instanceof Error &&
          (error.message.includes("not responding") ||
            error.message.includes("connect to server"))
        )
      ) {
        console.error("Failed to delete confession:", error);
      }
    },
  });
};

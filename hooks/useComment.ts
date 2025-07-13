import {
  createComment,
  getComments,
  getCommentsByConfession,
  getCommentsPaginationByConfession,
} from "@/services/api/comment";
import { networkAxiosError, retryAxiosError } from "@/utils/axios-error";
import { Comments, CreateComment } from "@/utils/types";
import {
  InfiniteData,
  QueryObserverResult,
  UseBaseMutationResult,
  useInfiniteQuery,
  UseInfiniteQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

export const useGetComments = (): QueryObserverResult<Comments[]> => {
  return useQuery<Comments[]>({
    queryKey: ["comments"],
    queryFn: async ({ signal }) => {
      try {
        const response = await getComments(signal);
        return response.data;
      } catch (error) {
        const err = error as AxiosError;
        networkAxiosError(err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failedCount, error) => {
      if (error instanceof Error) {
        retryAxiosError(failedCount, error as AxiosError);

        if (error.message.includes("Network Error")) {
          return false;
        }
      }

      return failedCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

export const useGetCommentsByConfession = (
  id: string
): QueryObserverResult<Comments[]> => {
  return useQuery<Comments[]>({
    queryKey: ["comments", id],
    queryFn: async () => {
      try {
        const response = await getCommentsByConfession(id);
        return response.data;
      } catch (error) {
        const err = error as AxiosError;
        return networkAxiosError(err);
      }
    },
    refetchOnWindowFocus: false,
    retry: (failedCount, error) => {
      if (error instanceof Error) {
        retryAxiosError(failedCount, error as AxiosError);
        if (error.message.includes("Network Error")) {
          return false;
        }
      }

      return failedCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

export const useGetCommentsPaginatedByConfession = (
  id: string
): UseInfiniteQueryResult<InfiniteData<Comments[], unknown>, Error> => {
  return useInfiniteQuery<Comments[]>({
    queryKey: ["comments", id],
    queryFn: async ({ pageParam = 1, signal }) => {
      try {
        const response = await getCommentsPaginationByConfession(
          id,
          pageParam as number,
          signal
        );
        return response.data;
      } catch (error) {
        const err = error as AxiosError;
        return networkAxiosError(err);
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < 5 ? undefined : allPages.length + 1;
    },
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        retryAxiosError(failureCount, error as AxiosError);
        if (error.message.includes("Network Error")) {
          return false;
        }
      }

      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

export const useCreateComment = (): UseBaseMutationResult<
  AxiosResponse<CreateComment>,
  unknown,
  CreateComment
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateComment) => {
      try {
        return createComment(data);
      } catch (error) {
        const err = error as AxiosError;
        networkAxiosError(err);
        throw err;
      }
    },
    mutationKey: ["comments", "confession"],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.confession],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["confession", variables.confession],
        refetchType: "all",
      });
    },
    onError: () => {
      console.error("Failed to create comment");
      queryClient.invalidateQueries({
        queryKey: ["confessions", "topConfessions", "confession"],
        refetchType: "all",
      });
    },
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        retryAxiosError(failureCount, error as AxiosError);
        if (error.message.includes("Network Error")) {
          return false;
        }
      }

      return failureCount < 1;
    },
  });
};

import {
  createChildrenComment,
  getChildrenCommentById,
  getChildrenCommentPaginatedByParent,
} from "@/services/api/children-comment";
import { networkAxiosError } from "@/utils/axios-error";
import { CreateChildrenComment, ShowChildrenComment } from "@/utils/types";
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

export const useCreateChildenComment = (): UseBaseMutationResult<
  AxiosResponse<CreateChildrenComment>,
  unknown,
  CreateChildrenComment & { confessionId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChildrenComment & { confessionId: string }) => {
      const { confessionId, ...finalData } = data;
      return createChildrenComment(finalData);
    },
    mutationKey: ["childrenComments"],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["childrenComments", variables.comment],
      });
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.confessionId],
      });
    },
    onError: (s) => {
      console.error("Failed to create comment");
      queryClient.invalidateQueries({ queryKey: ["childrenComments"] });
      queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
  });
};
export const useGetChildrenComments = (): QueryObserverResult<
  ShowChildrenComment[]
> => {
  return useQuery<ShowChildrenComment[]>({
    queryFn: async ({ signal }) => {
      const { data } = await getChildrenCommentById("", signal);
      return data;
    },
    queryKey: ["childrenComments"],
    refetchOnWindowFocus: false,
    retry: (failedCount, error) => {
      if (error instanceof Error) {
        return error.message.includes("Network Error") ? false : true;
      }
      return failedCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

export const useGetChildrenCommentsById = (
  id: string
): QueryObserverResult<ShowChildrenComment[]> => {
  return useQuery<ShowChildrenComment[]>({
    queryFn: async ({ signal }) => {
      const { data } = await getChildrenCommentById(id, signal);
      return data;
    },
    queryKey: ["childrenComments", id],
    refetchOnWindowFocus: false,
    retry: (failedCount, error) => {
      if (error instanceof Error) {
        return error.message.includes("Network Error") ? false : true;
      }
      return failedCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

export const useGetChildrenCommentsPagination = (
  id: string
): UseInfiniteQueryResult<
  InfiniteData<ShowChildrenComment[], unknown>,
  Error
> => {
  return useInfiniteQuery<ShowChildrenComment[]>({
    queryKey: ["childrenComments", id],
    queryFn: async ({ pageParam = 1, signal }) => {
      try {
        const response = await getChildrenCommentPaginatedByParent(
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
      const hasMoreData = lastPage && lastPage.length >= 5;
      return hasMoreData ? allPages.length + 1 : undefined;
    },
    retry: (failedCount, error) => {
      if (error instanceof Error) {
        return error.message.includes("Network Error") ? false : true;
      }
      return failedCount < 2;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });
};

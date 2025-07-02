import {
  createChildrenComment,
  getChildrenCommentById,
} from "@/services/api/children-comment";
import { CreateChildrenComment, ShowChildrenComment } from "@/utils/types";
import {
  QueryObserverResult,
  UseBaseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useCreateChildenComment = (): UseBaseMutationResult<
  AxiosResponse<CreateChildrenComment>,
  unknown,
  CreateChildrenComment
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChildrenComment) => createChildrenComment(data),
    mutationKey: ["childrenComments"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["childrenComments"] });
    },
  });
};
export const useGetChildrenComments = (): QueryObserverResult<
  ShowChildrenComment[]
> => {
  return useQuery<ShowChildrenComment[]>({
    queryFn: async () => {
      const { data } = await getChildrenCommentById("");
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
    queryFn: async () => {
      const { data } = await getChildrenCommentById(id);
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

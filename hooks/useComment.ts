import { createComment, getCommentsByConfession } from "@/services/comment";
import { Comments, CreateComment } from "@/utils/types";
import {
  QueryObserverResult,
  UseBaseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useGetCommentsByConfession = (
  id: string
): QueryObserverResult<Comments[]> => {
  return useQuery<Comments[]>({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data } = await getCommentsByConfession(id);
      return data;
    },
  });
};

export const useCreateComment = (): UseBaseMutationResult<
  AxiosResponse<CreateComment>,
  unknown,
  CreateComment
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateComment) => createComment(data),
    mutationKey: ["comments"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] }),
        queryClient.invalidateQueries({ queryKey: ["confessions"] });
    },
    onError: () => {
      throw new Error("There is something wrong creating your comment");
    },
  });
};

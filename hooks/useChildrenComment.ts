import {
  createChildrenComment,
  getChildrenCommentById,
} from "@/services/children-comment";
import { ChildrenComment, CreateChildrenComment } from "@/utils/types";
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
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};

export const useGetChildrenCommentsById = (
  id: string
): QueryObserverResult<ChildrenComment[]> => {
  return useQuery<ChildrenComment[]>({
    queryFn: async () => {
      const { data } = await getChildrenCommentById(id);
      return data;
    },
    queryKey: ["childrenComments", id],
  });
};

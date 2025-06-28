import {
  createLike,
  deleteLike,
  getLikes,
  getLikesByConfession,
} from "@/services/likes";
import { CreateLike, Likes } from "@/utils/types";
import {
  UseBaseMutationResult,
  UseBaseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useGetLikes = (): UseBaseQueryResult<Likes[]> => {
  return useQuery<Likes[]>({
    queryKey: ["likes"],
    queryFn: async () => {
      const { data } = await getLikes();
      return data;
    },
  });
};

export const useCreateLike = (): UseBaseMutationResult<
  AxiosResponse<Likes>,
  unknown,
  CreateLike,
  unknown
> => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse<Likes>, unknown, CreateLike, unknown>({
    mutationFn: (data: CreateLike) => createLike(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
    onError: () => {
      throw new Error("Failed to create like");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
  });
};

export const useGetLikesByConfession = (
  id: string
): UseBaseQueryResult<AxiosResponse<Likes[]>> => {
  return useQuery<AxiosResponse<Likes[]>>({
    queryKey: ["likes", id],
    queryFn: async () => {
      const { data } = await getLikesByConfession(id);
      return data;
    },
  });
};

export const useGetLikesByComment = (id: string) =>
  useQuery<AxiosResponse<Likes[]>>({
    queryKey: ["likes", id],
    queryFn: async () => {
      const { data } = await getLikesByConfession(id);
      return data;
    },
  });

export const useGetLikesByReply = (id: string) =>
  useQuery<AxiosResponse<Likes[]>>({
    queryKey: ["likes", id],
    queryFn: async () => {
      const { data } = await getLikesByConfession(id);
      return data;
    },
  });

export const useDeleteLike = (): UseBaseMutationResult<
  AxiosResponse<Likes>,
  unknown,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation<AxiosResponse<Likes>, unknown, string>({
    mutationFn: (id: string) => deleteLike(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
    onError: () => {
      throw new Error("Failed to delete like");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
  });
};

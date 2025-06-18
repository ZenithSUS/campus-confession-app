import { createLike, deleteLike, getLikesByConfession } from "@/services/likes";
import { CreateLike, Likes } from "@/utils/types";
import { UseBaseQueryResult, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useCreateLike = async (
  data: CreateLike
): Promise<AxiosResponse<CreateLike>> => {
  return await createLike(data);
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

export const useDeleteLike = async (
  id: string
): Promise<AxiosResponse<Likes>> => {
  return await deleteLike(id);
};

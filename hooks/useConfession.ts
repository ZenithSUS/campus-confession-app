import {
  deleteConfession,
  getConfession,
  getConfessions,
} from "@/services/confession";
import { Confessions } from "@/utils/types";
import {
  QueryObserverResult,
  UseBaseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useGetConfession = (): QueryObserverResult<Confessions[]> => {
  return useQuery<Confessions[]>({
    queryKey: ["confessions"],
    queryFn: async () => {
      const { data } = await getConfessions();
      return data;
    },
  });
};

export const useGetConfessionById = (
  id: string
): QueryObserverResult<Confessions> => {
  return useQuery<Confessions>({
    queryKey: ["confession", id],
    queryFn: async () => {
      const { data } = await getConfession(id);
      return data;
    },
  });
};

export const useDeleteConfession = (): UseBaseMutationResult<
  AxiosResponse<Confessions>,
  unknown,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteConfession(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["confessions"] }),
    onError: () => {
      throw new Error("Failed to delete confession");
    },
  });
};

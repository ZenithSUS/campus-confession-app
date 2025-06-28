import {
  createConfession,
  deleteConfession,
  getConfession,
  getConfessions,
} from "@/services/confession";
import { Confessions, CreateConfession, ShowConfessions } from "@/utils/types";
import {
  QueryObserverResult,
  UseBaseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useGetConfession = (): QueryObserverResult<ShowConfessions[]> => {
  return useQuery<ShowConfessions[]>({
    queryKey: ["confessions"],
    queryFn: async () => {
      const { data } = await getConfessions();
      return data;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetConfessionById = (
  id: string
): QueryObserverResult<ShowConfessions> => {
  return useQuery<ShowConfessions>({
    queryKey: ["confession", id],
    queryFn: async () => {
      const { data } = await getConfession(id);
      return data;
    },
  });
};

export const useCreateConfession = async (
  data: CreateConfession
): Promise<AxiosResponse<CreateConfession>> => {
  try {
    return await createConfession(data);
  } catch (error) {
    throw new Error("Failed to create confession");
  }
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

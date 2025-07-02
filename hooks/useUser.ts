import { createUser, getUsers } from "@/services/api/users";
import { networkAxiosError, retryAxiosError } from "@/utils/axios-error";
import { User } from "@/utils/types";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

export const useCreateUser = (): UseMutationResult<
  AxiosResponse<User>,
  unknown,
  User,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: User) => createUser(data),
    mutationKey: ["users"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      throw new Error("Failed to create user");
    },
  });
};

export const useGetUsers = (): UseQueryResult<User[]> => {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await getUsers();
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

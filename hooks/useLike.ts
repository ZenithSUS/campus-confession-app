import {
  createLike,
  deleteLike,
  getLikes,
  getLikesByConfession,
} from "@/services/api/likes";
import { networkAxiosError, retryAxiosError } from "@/utils/axios-error";
import {
  ChildrenComment,
  Comments,
  CreateLike,
  DeleteLikeParams,
  Likes,
  ShowChildrenComment,
  ShowConfessions,
} from "@/utils/types";
import {
  UseBaseMutationResult,
  UseBaseQueryResult,
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

export const useGetLikes = (): UseBaseQueryResult<Likes[]> => {
  return useQuery<Likes[]>({
    queryKey: ["likes"],
    queryFn: async () => {
      try {
        const response = await getLikes();
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
          console.log("Network Error");
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
    queryFn: async ({ signal }) => {
      const { data } = await getLikesByConfession(id, signal);
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

export const useCreateLike = (): UseBaseMutationResult<
  AxiosResponse<ShowConfessions>,
  unknown,
  CreateLike,
  Likes
> => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ShowConfessions & Comments>,
    unknown,
    CreateLike,
    Likes
  >({
    mutationFn: (data: CreateLike) => {
      return createLike(data);
    },
    onSuccess: (newLike, variables) => {
      queryClient.setQueryData(["confessions"], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: ShowConfessions[]) => {
            return page.map((confesion) => {
              if (confesion.$id !== variables.confessionId) return confesion;

              return {
                ...confesion,
                likesLength:
                  confesion.likesData.filter((like) => {
                    return like.$id !== newLike.data.$id;
                  }).length + 1,
                likesData: [...confesion.likesData, newLike.data.likesData],
              };
            });
          }),
        };
      });

      queryClient.setQueryData(["topConfessions"], (oldData: any) => {
        if (!oldData) return oldData;

        const newTopConfessions = oldData
          .map((confession: ShowConfessions) => {
            if (confession.$id !== variables.confessionId) return confession;

            return {
              ...confession,
              likesLength:
                confession.likesData.filter((like) => {
                  return like.$id !== newLike.data.$id;
                }).length + 1,
              likesData: [...confession.likesData, newLike.data.likesData],
            };
          })
          .sort(
            (a: ShowConfessions, b: ShowConfessions) =>
              b.likesLength - a.likesLength
          );
        return newTopConfessions;
      });

      queryClient.setQueryData(
        ["confession", variables.confessionId],
        (oldData: ShowConfessions) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            likesLength: oldData.likesLength + 1,
            likesData: [...oldData.likesData, newLike.data.likesData],
          };
        }
      );
    },
    onError: () => {
      console.error("Failed to create like");
    },
    retry: false,
  });
};

export const useCreateLikeComment = (): UseBaseMutationResult<
  AxiosResponse<Comments>,
  unknown,
  CreateLike,
  Likes
> => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse<Comments>, unknown, CreateLike, Likes>({
    mutationFn: (data: CreateLike) => {
      const { confessionId, ...finalData } = data;
      return createLike(finalData);
    },
    onSuccess: (newLike, variables) => {
      queryClient.setQueryData(
        ["comments", variables.confessionId],
        (oldData: any) => {
          if (!oldData) return oldData;

          const updatedComments = oldData.pages.map((page: Comments[]) => {
            return page.map((comment) => {
              if (comment.$id !== variables.commentId) return comment;

              return {
                ...comment,
                likesLength: comment.likesLength + 1,
                likesData: [...comment.likesData, newLike.data.likesData],
              };
            });
          });

          return {
            ...oldData,
            pages: updatedComments,
          };
        }
      );
    },
    onError: () => {
      console.error("Failed to create like");
    },
    retry: false,
  });
};

export const useCreateLikeReply = (): UseMutationResult<
  AxiosResponse<ChildrenComment>,
  unknown,
  CreateLike,
  Likes
> => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ChildrenComment>,
    unknown,
    CreateLike,
    Likes
  >({
    mutationFn: async (data: CreateLike) => {
      const { confessionId, commentId, ...finalData } = data;
      return createLike(finalData);
    },
    onSuccess: (newLike, variables) => {
      queryClient.setQueryData(
        ["childrenComments", variables.commentId],
        (oldData: any) => {
          if (!oldData) return oldData;

          const updatedReplies = oldData.pages.map(
            (page: ShowChildrenComment[]) => {
              return page.map((reply) => {
                if (reply.$id !== variables.childrenCommentId) return reply;

                return {
                  ...reply,
                  likesLength: reply.likesData.length + 1,
                  likesData: [...reply.likesData, newLike.data.likesData],
                };
              });
            }
          );

          return {
            ...oldData,
            pages: updatedReplies,
          };
        }
      );
    },
    onError: () => {
      console.error("Failed to create like");
      queryClient.invalidateQueries({
        queryKey: ["childrenComments"],
        refetchType: "all",
        exact: true,
      });
    },
    retry: false,
  });
};

export const useDeleteLike = (): UseBaseMutationResult<
  AxiosResponse<Likes>,
  unknown,
  DeleteLikeParams
> => {
  const queryClient = useQueryClient();
  return useMutation<AxiosResponse<Likes>, unknown, DeleteLikeParams>({
    mutationFn: ({ likeId }: DeleteLikeParams) => deleteLike(likeId),
    onSuccess: (_, { likeId, confessionId, commentId, childrenCommentId }) => {
      // If confessionId is provided, delete the like from the confession

      if (!commentId && !childrenCommentId) {
        queryClient.setQueryData(["confessions"], (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: ShowConfessions[]) => {
              return page.map((confession) => {
                // Check if this confession contains the likeId in its likesData
                const hasLike = confession.likesData.some(
                  (like) => like.$id === likeId
                );

                if (!hasLike) return confession;

                return {
                  ...confession,
                  likesLength: hasLike ? confession.likesLength - 1 : 0,
                  likesData: confession.likesData.filter(
                    (like) => like.$id !== likeId
                  ),
                };
              });
            }),
          };
        });

        queryClient.setQueryData(["topConfessions"], (oldData: any) => {
          if (!oldData) return oldData;

          const newTopConfessions = oldData
            .map((confession: ShowConfessions) => {
              const hasLike = confession.likesData.some(
                (like) => like.$id === likeId
              );

              if (!hasLike) return confession;

              return {
                ...confession,
                likesLength: hasLike ? confession.likesLength - 1 : 0,
                likesData: confession.likesData.filter(
                  (like) => like.$id !== likeId
                ),
              };
            })
            .sort(
              (a: ShowConfessions, b: ShowConfessions) =>
                b.likesLength - a.likesLength
            );

          return newTopConfessions;
        });

        queryClient.setQueryData(
          ["confession", confessionId],
          (oldData: ShowConfessions) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              likesLength: oldData.likesLength - 1,
              likesData: oldData.likesData.filter(
                (like) => like.$id !== likeId
              ),
            };
          }
        );
      }

      // If it's a comment
      if (commentId) {
        queryClient.setQueryData(["comments", confessionId], (oldData: any) => {
          if (!oldData) return oldData;

          const updatedComments = oldData.pages.map((page: Comments[]) => {
            return page.map((comment) => {
              const hasLike = comment.likesData.some(
                (like) => like.$id === likeId
              );

              if (!hasLike) return comment;

              return {
                ...comment,
                likesLength: hasLike ? comment.likesLength - 1 : 0,
                likesData: comment.likesData.filter(
                  (like) => like.$id !== likeId
                ),
              };
            });
          });

          return {
            ...oldData,
            pages: updatedComments,
          };
        });
      }

      // If it's a reply
      if (childrenCommentId) {
        queryClient.setQueryData(
          ["childrenComments", commentId],
          (oldData: any) => {
            if (!oldData) return oldData;

            const updatedReplies = oldData.pages.map(
              (page: ChildrenComment[]) => {
                return page.map((reply) => {
                  const hasLike = reply.likesData.some(
                    (like) => like.$id === likeId
                  );

                  if (!hasLike) return reply;

                  return {
                    ...reply,
                    likesLength: hasLike ? reply.likesLength - 1 : 0,
                    likesData: reply.likesData.filter(
                      (like) => like.$id !== likeId
                    ),
                  };
                });
              }
            );

            return {
              ...oldData,
              pages: updatedReplies,
            };
          }
        );
      }
    },
    onError: () => {
      console.error("Failed to delete like");
      queryClient.invalidateQueries({
        queryKey: ["confessions", "topConfessions", "confession"],
        refetchType: "all",
      });
    },
    retry: false,
  });
};

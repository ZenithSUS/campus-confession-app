import { User } from "@/utils/types";
import axiosClient from "../axios";

export const getUsers = () => axiosClient.get("/users");

export const createUser = (data: User) => axiosClient.post("/users", data);

export const deleteUser = (id: string) => axiosClient.delete(`/users/${id}`);

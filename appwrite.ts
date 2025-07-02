import { Account, Client } from "react-native-appwrite";
import { assignName } from "./utils/assign-name";
import { User } from "./utils/types";

const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
};

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);
const account = new Account(client);

export async function createAnonymousSession(processedUsers: User[]) {
  const acc = await account.createAnonymousSession();
  await account.updatePrefs({ nickname: assignName(processedUsers) });
  return acc;
}

export async function getCurrentSession() {
  const acc = await account.get();
  return acc;
}

export async function deleteSession() {
  await account.deleteSession("current");
}

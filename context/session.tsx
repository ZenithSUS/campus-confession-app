import {
  createAnonymousSession,
  deleteSession,
  getCurrentSession,
} from "@/appwrite";
import { useCreateUser, useGetUsers } from "@/hooks/useUser";
import {
  getSingleData,
  removeData,
  storeSingleData,
} from "@/services/react-native-storage";
import { Session } from "@/utils/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SessionContextType = {
  session: Session;
  isLoading: boolean;
  isInitialized: boolean;
  refreshSession: () => Promise<void>;
  clearSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Local state
  const [session, setSession] = useState<Session>({ $id: "", nickname: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hooks
  const { mutateAsync: createUser } = useCreateUser();
  const { data: users, isLoading: isUsersLoading } = useGetUsers();

  const processedUsers = useMemo(() => {
    if (!isUsersLoading && users) return users;
    return [];
  }, [isUsersLoading, users]);

  // Create new session
  const createNewSession = useCallback(async (): Promise<Session> => {
    await createAnonymousSession(processedUsers);
    const newSession = await getCurrentSession();
    const sessionData = {
      $id: newSession.$id,
      nickname: newSession.prefs.nickname,
    };
    const userData = { $id: newSession.$id, name: sessionData.nickname };
    await createUser(userData);
    await storeSingleData("session", newSession.$id);
    return sessionData;
  }, []);

  // Clear stored session
  const clearStoredSession = useCallback(async (): Promise<void> => {
    try {
      await removeData("session");
      await deleteSession();
    } catch (error) {
      console.log("No existing session to delete:", error);
    }
  }, []);

  // Initialize session
  const initializeSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const storedSessionId = await getSingleData("session");

      if (storedSessionId) {
        try {
          // Try to get current session to verify it's still valid
          const currentSession = await getCurrentSession();
          const sessionData = {
            $id: currentSession.$id,
            nickname: currentSession.prefs.nickname,
          };
          setSession(sessionData);

          // Update stored session ID if it changed
          if (currentSession.$id !== storedSessionId) {
            await storeSingleData("session", currentSession.$id);
          }
        } catch (sessionError) {
          // Session is invalid, clear it and create new one
          console.log("Stored session is invalid, creating new session");
          await clearStoredSession();
          const newSession = await createNewSession();
          setSession(newSession);
        }
      } else {
        // No stored session, create new one
        const newSession = await createNewSession();
        setSession(newSession);
      }
    } catch (error) {
      console.error("Failed to initialize session:", error);
      // Fallback: clear everything and create new session
      await clearStoredSession();
      const newSession = await createNewSession();
      setSession(newSession);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [createNewSession, clearStoredSession]);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      console.log("Refreshing session...");
      const currentSession = await getCurrentSession();
      const sessionData = {
        $id: currentSession.$id,
        nickname: currentSession.prefs.nickname,
      };
      setSession(sessionData);
      await storeSingleData("session", currentSession.$id);
    } catch (error) {
      console.error("Failed to refresh session:", error);
      // If refresh fails, reinitialize
      await initializeSession();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [initializeSession]);

  // Clear session
  const clearSession = useCallback(async (): Promise<void> => {
    try {
      await clearStoredSession();
      const newSession = await createNewSession();
      setSession(newSession);
    } catch (error) {
      console.error("Failed to clear session:", error);
      throw error;
    }
  }, [clearStoredSession, createNewSession]);

  useEffect(() => {
    if (!isUsersLoading && users) {
      // Wait for users to load before initializing session
      initializeSession();
    }
  }, [initializeSession, isUsersLoading, processedUsers, users]);

  const contextValue: SessionContextType = {
    session,
    isLoading,
    isInitialized,
    refreshSession,
    clearSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

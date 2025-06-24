import {
  createAnonymousSession,
  deleteSession,
  getCurrentSession,
} from "@/appwrite";
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
  const [session, setSession] = useState<Session>({ $id: "", nickname: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const createNewSession = useCallback(async (): Promise<Session> => {
    await createAnonymousSession();
    const newSession = await getCurrentSession();
    const sessionData = {
      $id: newSession.$id,
      nickname: newSession.prefs.nickname,
    };
    await storeSingleData("session", newSession.$id);
    return sessionData;
  }, []);

  const clearStoredSession = useCallback(async (): Promise<void> => {
    try {
      await removeData("session");
      await deleteSession();
    } catch (error) {
      console.log("No existing session to delete:", error);
    }
  }, []);

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

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
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
    }
  }, [initializeSession]);

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
    initializeSession();
  }, [initializeSession]);

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

import {
  createAnonymousSession,
  deleteSession,
  getCurrentSession,
} from "@/appwrite";
import { Session } from "@/utils/types";
import React, { createContext, useContext, useEffect, useState } from "react";

type SessionContextType = {
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
};

const SessionContext = createContext<SessionContextType>({
  session: {
    $id: "",
    nickname: "",
  },
  setSession: () => {},
});

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session>({ $id: "", nickname: "" });

  const checkAuth = async () => {
    try {
      const session = await getCurrentSession();
      setSession({ $id: session.$id, nickname: session.prefs.nickname });
    } catch (error) {
      // Try to clean up any existing session first
      try {
        await deleteSession();
      } catch {
        // No session to delete, which is fine
      }

      await createAnonymousSession();
      const newSession = await getCurrentSession();
      setSession({ $id: newSession.$id, nickname: newSession.prefs.nickname });
    }
  };

  useEffect(() => {
    checkAuth();
  }, [setSession, checkAuth]);

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);

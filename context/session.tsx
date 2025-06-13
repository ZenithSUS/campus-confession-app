import { createAnonymousSession, getCurrentSession } from "@/appwrite";
import { Session } from "@/utils/types";
import React, { createContext, useContext, useEffect, useState } from "react";

type SessionContextType = {
    session: Session;
    setSession: React.Dispatch<React.SetStateAction<Session>>;
}

const SessionContext = createContext<SessionContextType>({
    session: {
        $id: "",
        nickname: ""
    },
    setSession: () => {}
});

export const SessionProvider = ({ children } : { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session>({ $id: "", nickname: "" });

    const checkAuth = async () => {
        try {
            const session = await getCurrentSession();
            setSession({ $id: session.$id, nickname: session.prefs.nickname });
        } catch (error) {
            await createAnonymousSession();
            const session = await getCurrentSession();
            setSession({ $id: session.$id, nickname: session.prefs.nickname });
        }
    }

    useEffect(() => {
        checkAuth();
    }, [session])

    return (
        <SessionContext.Provider value={{ session, setSession }}>
            {children}
        </SessionContext.Provider>
    )
}

export const useSession = () => useContext(SessionContext);
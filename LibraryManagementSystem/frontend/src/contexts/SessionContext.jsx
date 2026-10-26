import { createContext, useState, useContext, useEffect } from "react";

const SessionContext = createContext();

export const useSessionContext = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [sessionID, setSessionID] = useState("");

  useEffect(() => {
    const storedSessionID = localStorage.getItem("sessionID");
    if (storedSessionID) {
      setSessionID(storedSessionID);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sessionID", sessionID);
  }, [sessionID]);

  const value = { sessionID, setSessionID };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

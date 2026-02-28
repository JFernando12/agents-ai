"use client";

import { getUserFromStorage, saveUserToStorage, User } from "@/lib/user";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getUserFromStorage();
    setUserState(user);
    setIsLoading(false);
  }, []);

  const setUser = (user: User | null) => {
    setUserState(user);

    saveUserToStorage(user);
  };

  const logout = () => {
    setUser(null);
    console.log("User logged out, localStorage cleared");
  };

  const value = {
    user,
    setUser,
    isLoading,
    setIsLoading,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

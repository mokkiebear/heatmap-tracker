import { App } from "obsidian";
import { createContext, useContext } from "react";

export const AppContext = createContext<App | undefined>(undefined);

export const useAppContext = (): App => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }

  return context;
};

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface CreateSheetContextValue {
  isOpen: boolean;
  openCreateSheet: () => void;
  closeCreateSheet: () => void;
}

const CreateSheetContext = createContext<CreateSheetContextValue | null>(null);

export function CreateSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCreateSheet = useCallback(() => setIsOpen(true), []);
  const closeCreateSheet = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openCreateSheet, closeCreateSheet }),
    [isOpen, openCreateSheet, closeCreateSheet]
  );

  return (
    <CreateSheetContext.Provider value={value}>
      {children}
    </CreateSheetContext.Provider>
  );
}

export function useCreateSheet() {
  const context = useContext(CreateSheetContext);

  if (!context) {
    throw new Error("useCreateSheet must be used within CreateSheetProvider");
  }

  return context;
}

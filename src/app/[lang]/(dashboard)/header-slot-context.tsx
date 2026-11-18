"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type HeaderSlotContextType = {
  slot: ReactNode;
  setSlot: (node: ReactNode) => void;
};

const HeaderSlotContext = createContext<HeaderSlotContextType>({
  slot: null,
  setSlot: () => {},
});

export function HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode>(null);
  return (
    <HeaderSlotContext.Provider value={{ slot, setSlot }}>
      {children}
    </HeaderSlotContext.Provider>
  );
}

export function useHeaderSlot() {
  return useContext(HeaderSlotContext).slot;
}

export function useSetHeaderSlot() {
  return useContext(HeaderSlotContext).setSlot;
}

"use client";

import { createContext, useContext } from "react";
import type { HouseholdUser } from "@/lib/household-profiles";

type AccessContextValue = {
  activeUser: HouseholdUser;
  setActiveUser: (user: HouseholdUser) => void;
  ownerPinEnabled: boolean;
  ownerUnlocked: boolean;
  unlockOwner: (pin: string) => boolean;
  lockOwner: () => void;
};

export const AccessContext = createContext<AccessContextValue>({
  activeUser: "his",
  setActiveUser: () => {},
  ownerPinEnabled: false,
  ownerUnlocked: false,
  unlockOwner: () => true,
  lockOwner: () => {},
});

export function useAccess() {
  return useContext(AccessContext);
}

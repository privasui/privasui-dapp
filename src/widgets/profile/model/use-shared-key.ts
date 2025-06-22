import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SharedKeyStore = {
  sharedKey: string;
  setSharedKey: (key: string) => void;
};

const SHARED_KEY_STORAGE_KEY = "privasui_shared_key";

export const useSharedKeyStore = create<SharedKeyStore>()(
  persist(
    (set) => ({
      sharedKey: sessionStorage.getItem(SHARED_KEY_STORAGE_KEY) || "",
      setSharedKey: (key: string) => set({ sharedKey: key }),
    }),
    {
      name: SHARED_KEY_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

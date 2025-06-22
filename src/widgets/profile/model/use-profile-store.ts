// src/widgets/profile/model/use-profiles-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileData {
  address: string;
  name?: string;
  avatarSvgUrl?: string;
  lastFetched: number;
}

interface ProfilesState {
  profiles: Record<string, ProfileData>;
  addProfile: (address: string, data: Omit<ProfileData, 'address' | 'lastFetched'>) => void;
  getProfile: (address: string) => ProfileData | undefined;
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: {},
      addProfile: (address: string, data: Omit<ProfileData, 'address' | 'lastFetched'>) => set((state) => ({
        profiles: {
          ...state.profiles,
          [address]: {
            address,
            ...data,
            lastFetched: Date.now(),
          },
        },
      })),
      getProfile: (address) => get().profiles[address],
    }),
    {
      name: 'profiles-storage',
    }
  )
);
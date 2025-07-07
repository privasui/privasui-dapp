import { create } from 'zustand';
import { PiNSNftData } from './use-pins-batch-data';

export type ModalType = 'send' | 'sell' | null;

interface PinsModalsState {
  activeModal: ModalType;
  selectedNft: PiNSNftData | null;
  isOpen: boolean;
  
  // Actions
  openSendModal: (nft: PiNSNftData) => void;
  openSellModal: (nft: PiNSNftData) => void;
  closeModal: () => void;
}

export const usePinsModals = create<PinsModalsState>((set) => ({
  activeModal: null,
  selectedNft: null,
  isOpen: false,

  openSendModal: (nft: PiNSNftData) => set({
    activeModal: 'send',
    selectedNft: nft,
    isOpen: true
  }),

  openSellModal: (nft: PiNSNftData) => set({
    activeModal: 'sell',
    selectedNft: nft,
    isOpen: true
  }),

  closeModal: () => set({
    activeModal: null,
    selectedNft: null,
    isOpen: false
  })
})); 
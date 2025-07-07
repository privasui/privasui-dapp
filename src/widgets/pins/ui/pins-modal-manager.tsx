import React from 'react';
import { usePinsModals } from '../model/use-pins-modals';
import { PinsNftSendDrawer } from './pins-nft-send-drawer';
import { PinsNftSellDrawer } from './pins-sell-drawer';

interface PinsModalManagerProps {
  onSuccess?: () => void;
}

export const PinsModalManager: React.FC<PinsModalManagerProps> = ({
  onSuccess
}) => {
  const { activeModal, selectedNft, isOpen, closeModal } = usePinsModals();

  const handleSuccess = () => {
    closeModal();
    onSuccess?.();
  };

  return (
    <>
      {/* Send Modal */}
      {activeModal === 'send' && selectedNft && (
        <PinsNftSendDrawer
          isOpen={isOpen}
          onClose={closeModal}
          nft={selectedNft}
          onSuccess={handleSuccess}
        />
      )}

      {/* Sell Modal */}
      {activeModal === 'sell' && selectedNft && (
        <PinsNftSellDrawer
          isOpen={isOpen}
          onClose={closeModal}
          nft={selectedNft}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}; 
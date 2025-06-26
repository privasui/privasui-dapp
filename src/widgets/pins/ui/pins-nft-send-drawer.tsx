import React from 'react';
import { Drawer } from "@/components/drawer";
import { PinsNftSend } from './pins-nft-send';
import { X } from 'lucide-react';
import { cn } from "@/shared/utils";

interface PinsNftSendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nft: any;
  onSuccess?: () => void;
}

// Header component for consistent UI
const DrawerHeader: React.FC<{
  title: string;
  onClose?: () => void;
}> = ({ title, onClose }) => {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    console.log("🔴 CLOSE BUTTON CLICKED in DrawerHeader");
    if (onClose) {
      console.log("🔴 Calling onClose from DrawerHeader");
      onClose();
    }
  };

  return (
    <div className="flex items-center justify-between pt-4 px-4 relative z-50 pb-2">
      {/* Empty space to balance layout */}
      <div className="w-[80px] flex items-center"></div>

      {/* Centered title */}
      <div className="flex-1 flex justify-center items-center">
        <span className="text-lg text-[#00ff00] font-mono font-bold">
          {title}
        </span>
      </div>

      {/* Simple close button without hover effects */}
      <div className="w-[80px] flex justify-end relative z-[100]">
        <div
          onClick={handleCloseClick}
          className="flex items-center justify-center cursor-pointer text-[#00ff00] p-3 w-12 h-12 relative z-[100]"
          style={{ cursor: 'pointer', position: 'relative', zIndex: 100 }}
        >
          <X size={26} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export const PinsNftSendDrawer: React.FC<PinsNftSendDrawerProps> = ({
  isOpen,
  onClose,
  nft,
  onSuccess
}) => {
  // Handle close button click
  const handleCloseClick = () => {
    console.log("🔴 Close button clicked in PinsNftSendDrawer, closing drawer");
    // Directly call onClose which should set the parent's state to false
    onClose();
  };

  React.useEffect(() => {
    console.log("🔴 Drawer isOpen state changed:", isOpen);
  }, [isOpen]);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        console.log("🔴 Drawer onOpenChange called with:", open);
        if (!open) {
          console.log("🔴 Drawer onOpenChange called with false, closing drawer");
          onClose();
        }
      }}
    >
      <div className="relative w-full overflow-hidden flex flex-col mobile-height">
        {/* Use the same DrawerHeader component pattern as in account-drawer */}
        <DrawerHeader 
          title="Send piNS NFT"
          onClose={handleCloseClick}
        />
        
        {/* Content */}
        <div className={cn(
          "absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out overflow-y-auto",
          "pt-20 px-4" // Add padding top to account for the header and sides for better spacing
        )}>
          <PinsNftSend
            nft={nft}
            onClose={handleCloseClick}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </Drawer>
  );
}; 
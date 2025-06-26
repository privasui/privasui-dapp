import { useState, useEffect } from "react";
import { ExternalLink, Clock, Send, Tag } from "lucide-react";
import { isDevnet, isTestnet } from "@/shared/network-config";
import { PinsNftSendDrawer } from "./pins-nft-send-drawer";
import { PinsNftSellDrawer } from "./pins-sell-drawer";

interface PinsNftItemProps {
  nft: any;
  expiration: string;
  finalImageUrl: string;
  piName: string;
  onNftSent?: () => void;
  showSendButton?: boolean;
  showSellButton?: boolean;
  showSuiVision?: boolean;
}

export const PinsNftItem = ({ 
  nft, 
  expiration, 
  finalImageUrl, 
  piName,
  onNftSent,
  showSendButton = true,
  showSellButton = true,
  showSuiVision = true
}: PinsNftItemProps) => {
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [sellDrawerOpen, setSellDrawerOpen] = useState(false);
  
  const nftData = nft.data as any;
  const objectId = nftData.objectId;

  // Add effect to log state changes
  useEffect(() => {
    console.log("🟢 PinsNftItem: sendDrawerOpen state changed to:", sendDrawerOpen);
  }, [sendDrawerOpen]);

  useEffect(() => {
    console.log("🟢 PinsNftItem: sellDrawerOpen state changed to:", sellDrawerOpen);
  }, [sellDrawerOpen]);

  const handleSendClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers from firing
    console.log("🟢 Send button clicked, opening drawer");
    setSendDrawerOpen(true);
  };

  const handleSellClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers from firing
    console.log("🟢 Sell button clicked, opening drawer");
    setSellDrawerOpen(true);
  };

  const handleSendSuccess = () => {
    console.log("🟢 Send success callback called");
    if (onNftSent) {
      onNftSent();
    }
  };

  const handleSellSuccess = () => {
    console.log("🟢 Sell success callback called");
    if (onNftSent) {
      onNftSent();
    }
  };

  const handleCloseSendDrawer = () => {
    console.log("🟢 handleCloseSendDrawer called in PinsNftItem");
    setSendDrawerOpen(false);
  };

  const handleCloseSellDrawer = () => {
    console.log("🟢 handleCloseSellDrawer called in PinsNftItem");
    setSellDrawerOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-[48px_1fr_auto] gap-4 items-center h-20 w-full border-b border-primary/20 px-4 cursor-pointer transition-colors hover:bg-primary/10">
        {/* NFT Image */}
        <div className="flex-shrink-0 w-12 h-12 bg-[#222] overflow-hidden flex items-center justify-center">
          {finalImageUrl && (
            <img
              src={finalImageUrl}
              alt={piName || 'piNS Name'}
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('[piNS ERROR] Failed to load image:', finalImageUrl);
                // Replace with fallback
                const target = e.currentTarget;
                target.onerror = null; // Prevent infinite error loop
                target.parentElement?.classList.add('bg-[#4CAF50]');
                target.style.display = 'none';
                
                // Create and append PINS text
                const textDiv = document.createElement('div');
                textDiv.className = 'font-bold text-black';
                textDiv.innerText = 'PINS';
                target.parentElement?.appendChild(textDiv);
              }}
            />
          )}
          {!finalImageUrl && (
            <div className="w-full h-full bg-[#4CAF50] flex items-center justify-center font-bold text-black">
              PINS
            </div>
          )}
        </div>
        
        {/* NFT Info */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="font-mono text-lg font-bold text-primary truncate">
            {piName || 'Unnamed piNS'}
          </div>
          
          <div className="font-mono text-sm text-primary/70 truncate flex items-center gap-2 mt-1">
            {/* Expires with consistent gap */}
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-primary/50 flex-shrink-0" />
              <span>Expires: {expiration === "Lifetime" ? "Never" : expiration}</span>
            </div>
            
            {/* SuiVision Link - Moved inline with Expires */}
            {showSuiVision && (
              <a
                href={`https://${isDevnet() ? 'devnet.' : isTestnet() ? 'testnet.' : ''}suivision.xyz/object/${objectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[#00ff00]/70 hover:text-[#00ff00] flex items-center gap-2 ml-2 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={objectId}
              >
                <ExternalLink size={12} className="text-primary/50 flex-shrink-0" />
                <span>SuiVision</span>
              </a>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-4">
          {/* Sell button - Icon only */}
          {showSellButton && (
            <button
              onClick={handleSellClick}
              className="text-[#00ff00] hover:text-[#00ff00]/80 transition-colors"
              title="Sell NFT"
            >
              <Tag size={18} className="flex-shrink-0" />
            </button>
          )}
          
          {/* Send button - Icon only */}
          {showSendButton && (
            <button
              onClick={handleSendClick}
              className="text-[#00ff00] hover:text-[#00ff00]/80 transition-colors"
              title="Send NFT"
            >
              <Send size={18} className="flex-shrink-0" />
            </button>
          )}
        </div>
      </div>
      
      {/* NFT Send Drawer */}
      {showSendButton && (
        <PinsNftSendDrawer
          isOpen={sendDrawerOpen}
          onClose={handleCloseSendDrawer}
          nft={nft}
          onSuccess={handleSendSuccess}
        />
      )}
      
      {/* NFT Sell Drawer */}
      {showSellButton && (
        <PinsNftSellDrawer
          isOpen={sellDrawerOpen}
          onClose={handleCloseSellDrawer}
          nft={nft}
          onSuccess={handleSellSuccess}
        />
      )}
    </>
  );
}; 
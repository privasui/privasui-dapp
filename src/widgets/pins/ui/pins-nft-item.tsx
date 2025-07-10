import { useState } from "react";
import { ExternalLink, Clock, Send, Tag, DollarSign, User, Database, ShoppingCart } from "lucide-react";
import { isDevnet, isTestnet } from "@/shared/network-config";
import { PinsNftSendDrawer } from "./pins-nft-send-drawer";
import { PinsNftSellDrawer } from "./pins-sell-drawer";
import { PiNameData } from "@/shared/suipi";

interface PinsNftItemProps {
  nft: any;
  expiration: string;
  finalImageUrl: string;
  piName: string;
  onNftSent?: () => void;
  onPriceChange?: () => void;
  showSendButton?: boolean;
  showSellButton?: boolean;
  showSuiVision?: boolean;
  salePrice?: string | null;
  loading?: boolean;
  piNameData?: PiNameData;
}

export const PinsNftItem = ({ 
  nft, 
  expiration, 
  finalImageUrl, 
  piName,
  onNftSent,
  onPriceChange = onNftSent,
  showSendButton = true,
  showSellButton = true,
  showSuiVision = true,
  salePrice,
  loading = false,
  piNameData
}: PinsNftItemProps) => {
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [sellDrawerOpen, setSellDrawerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const nftData = nft.data as any;
  const objectId = nftData.objectId;

  const handleSendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSendDrawerOpen(true);
  };

  const handleSellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSellDrawerOpen(true);
  };

  const handleItemClick = () => {
    setShowDetails(!showDetails);
  };

  const handleSendSuccess = () => {
    if (onNftSent) {
      onNftSent();
    }
  };

  const handleSellSuccess = () => {
    console.log("🔄 [PiNS] Price change successful, refreshing NFT list");
    if (onPriceChange) {
      onPriceChange();
    }
  };

  const handleCloseSendDrawer = () => {
    setSendDrawerOpen(false);
  };

  const handleCloseSellDrawer = () => {
    setSellDrawerOpen(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-[48px_1fr_auto] gap-4 items-center h-20 w-full border-b border-primary/20 px-4">
        <div className="w-12 h-12 bg-gray-700 animate-pulse rounded" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 animate-pulse rounded w-3/4" />
          <div className="h-3 bg-gray-700 animate-pulse rounded w-1/2" />
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-700 animate-pulse rounded" />
          <div className="w-8 h-8 bg-gray-700 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="grid grid-cols-[48px_1fr_auto] gap-4 items-center h-20 w-full border-b border-primary/20 px-4 cursor-pointer transition-colors hover:bg-primary/5"
        onClick={handleItemClick}
      >
        <div className="flex-shrink-0 w-12 h-12 bg-[#222] overflow-hidden rounded flex items-center justify-center">
          {!imageError && finalImageUrl ? (
            <img
              src={finalImageUrl}
              alt={piName}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[#4CAF50] flex items-center justify-center font-bold text-black text-xs">
              PINS
            </div>
          )}
        </div>
        
        <div className="flex flex-col justify-center min-w-0">
          <div className="font-mono text-lg font-bold text-primary truncate">
            {piName}
          </div>
          
          <div className="font-mono text-sm text-primary/70 truncate flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-primary/50 flex-shrink-0" />
              <span>Expires: {expiration === "Lifetime" ? "Never" : expiration}</span>
            </div>
            
            {showSuiVision && (
              <a
                href={`https://${isDevnet() ? 'devnet.' : isTestnet() ? 'testnet.' : ''}suivision.xyz/object/${objectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[#00ff00]/70 hover:text-[#00ff00] flex items-center gap-1 ml-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={objectId}
              >
                <ExternalLink size={10} className="text-primary/50 flex-shrink-0" />
                <span>SuiVision</span>
              </a>
            )}
          </div>

          {showDetails && piNameData && (
            <div className="mt-2 space-y-1 text-xs text-[#00ff00]/70 font-mono">
              <div className="flex items-center gap-1">
                <User size={10} className="text-[#00ff00]/50" />
                <span>Owner: {piNameData.owner.substring(0, 6)}...{piNameData.owner.substring(-4)}</span>
              </div>
              {piNameData.address && (
                <div className="flex items-center gap-1">
                  <Tag size={10} className="text-[#00ff00]/50" />
                  <span>Resolved Address: {piNameData.address.substring(0, 6)}...{piNameData.address.substring(-4)}</span>
                </div>
              )}
              {piNameData.data && Object.keys(piNameData.data).length > 0 && (
                <div className="flex items-center gap-1">
                  <Database size={10} className="text-[#00ff00]/50" />
                  <span>Has Additional Data</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showSellButton && salePrice ? (
            <button
              onClick={handleSellClick}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#00ff00]/10 cursor-pointer hover:bg-[#00ff00]/20 transition-colors"
              title="Update Price"
            >
              <ShoppingCart size={14} className="text-[#00ff00]" />
              <span className="text-[#00ff00] text-sm font-mono">{salePrice} SUI</span>
            </button>
          ) : showSellButton ? (
            <button
              onClick={handleSellClick}
              className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              title="Set Price"
            >
              <ShoppingCart size={16} className="text-primary/70" />
            </button>
          ) : null}
          
          {showSendButton && (
            <button
              onClick={handleSendClick}
              className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              title="Send PiNS"
            >
              <Send size={16} className="text-primary/70" />
            </button>
          )}
        </div>
      </div>
      
      {/* Send Drawer */}
      {sendDrawerOpen && (
        <PinsNftSendDrawer
          nft={nft}
          isOpen={sendDrawerOpen}
          onClose={handleCloseSendDrawer}
          onSuccess={handleSendSuccess}
        />
      )}
      
      {/* Sell Drawer */}
      {sellDrawerOpen && (
        <PinsNftSellDrawer
          nft={nft}
          isOpen={sellDrawerOpen}
          onClose={handleCloseSellDrawer}
          onSuccess={handleSellSuccess}
        />
      )}
    </>
  );
}; 
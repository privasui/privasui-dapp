import React, { useState, useEffect } from 'react';
import { Send, Clock, ExternalLink } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/shared/utils";
import { useNftTransfer } from '../model/use-nft-transfer';
import { usePinsNftImage, handlePinsImageError } from '../model/use-pins-nft-image';
import { PinsFallbackImage } from './pins-fallback-image';
import { isDevnet, isTestnet } from "@/shared/network-config";

interface PinsNftSendProps {
  nft: any;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const PinsNftSend: React.FC<PinsNftSendProps> = ({ 
  nft, 
  onClose,
  onSuccess
}) => {
  const { mutateAsync: sendNft } = useNftTransfer();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  // Extract NFT details
  const nftData = nft.data as any;
  const fields = nftData.content?.fields;
  const objectId = nftData.objectId;
  
  // Extract name from fields or display
  const name = fields && 'name' in fields ? String(fields.name) : '';
  const piName = name.endsWith('.pi') ? name : `${name}.pi`;

  // Extract expiration date
  const expirationField = fields && 'expiration_date' in fields ? String(fields.expiration_date) : 'Lifetime';
  const expiration = expirationField === "Lifetime" ? "Never" : expirationField;

  // Use the image utility to get consistent image handling
  const { finalImageUrl, hasImage } = usePinsNftImage(nft);

  // Add effect to prevent zoom on mobile
  useEffect(() => {
    // Add meta viewport tag to prevent zooming
    const originalViewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
    
    // Set viewport to prevent zooming
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    }
    
    // Restore original meta viewport on cleanup
    return () => {
      if (originalViewport && metaViewport) {
        metaViewport.setAttribute('content', originalViewport);
      }
    };
  }, []);

  const inputClassName = cn(
    "w-full px-3 py-2 bg-transparent",
    "text-[#00ff00] font-mono text-base outline-none",
    "border-b border-[#00ff00]/20",
    "transition-colors focus:border-[#00ff00]",
    "text-base" // Ensure text is reasonably sized for mobile
  );

  // Handle close button click
  const handleClose = () => {
    console.log("🔵 handleClose called in PinsNftSend");
    if (onClose) {
      console.log("🔵 Calling onClose from PinsNftSend");
      onClose();
    }
  };

  // Validate Sui address format (0x followed by 64 hex chars)
  const isValidSuiAddress = (address: string): boolean => {
    const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/;
    return suiAddressRegex.test(address);
  };

  const handleSendNft = async () => {
    // Enhanced validation for recipient address
    if (!recipientAddress.trim()) {
      setSendError("Please enter a recipient address");
      return;
    }

    // Check if address has valid Sui format
    if (!isValidSuiAddress(recipientAddress)) {
      setSendError("Invalid Sui address format");
      return;
    }

    setIsSending(true);
    setSendError("");

    try {
      // Call the NFT transfer function
      await sendNft({
        recipient: recipientAddress,
        objectId: objectId,
        onComplete: async () => {
          console.log("🔵 NFT sent successfully");
          setSendSuccess(true);
          setRecipientAddress("");
          
          setTimeout(() => {
            console.log("🔵 Success timeout completed, closing drawer");
            setSendSuccess(false);
            if (onSuccess) {
              console.log("🔵 Calling onSuccess");
              onSuccess();
            }
            handleClose(); // Use the handleClose function
          }, 3000);
        },
        onError: async (error) => {
          console.error("🔵 Error sending NFT:", error);
          setSendError(error.message);
        }
      });
    } catch (error: any) {
      console.error("🔵 Failed to send NFT:", error);
      setSendError(error.message || "Failed to send NFT");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6 p-4">
      {/* NFT Display - Updated to match PinsNftItem height and layout */}
      <div className="w-full rounded-2xl overflow-hidden border border-primary/15 p-0 bg-black/50">
        <div className="grid grid-cols-[48px_1fr_auto] gap-4 items-center h-20 w-full px-4">
          {/* NFT Image */}
          <div className="flex-shrink-0 w-12 h-12 bg-[#222] overflow-hidden flex items-center justify-center">
            {hasImage ? (
              <img 
                src={finalImageUrl} 
                alt={piName}
                className="w-full h-full object-contain"
                onError={handlePinsImageError}
              />
            ) : (
              <PinsFallbackImage />
            )}
          </div>
          
          {/* NFT Info */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="font-mono text-lg font-bold text-primary truncate">
              {piName}
            </div>
            
            {/* Expiration date with SuiVision link */}
            <div className="font-mono text-sm text-primary/70 truncate flex items-center gap-2 mt-1">
              {/* Expires with consistent gap */}
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-primary/50 flex-shrink-0" />
                <span>Expires: {expiration}</span>
              </div>
              
              {/* SuiVision Link - Inline with Expires */}
              <a
                href={`https://${isDevnet() ? 'devnet.' : isTestnet() ? 'testnet.' : ''}suivision.xyz/object/${objectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[#00ff00]/70 hover:text-[#00ff00] flex items-center gap-2 ml-2 transition-colors"
                title={objectId}
              >
                <ExternalLink size={12} className="text-primary/50 flex-shrink-0" />
                <span>SuiVision</span>
              </a>
            </div>
          </div>
          
          {/* Send button space (empty in this view) */}
          <div></div>
        </div>
      </div>

      <div className="h-20"></div>

      {/* Recipient Input - Matching AccountSend styling */}
      <div className="relative">
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipientAddress}
          onChange={(e) => {
            setRecipientAddress(e.target.value);
            // Clear error when user starts typing again
            if (sendError) setSendError("");
          }}
          className={cn(
            inputClassName,
            sendError && "border-[#ff4d4d]" // Add red border if there's an error
          )}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
      </div>

      <div className="h-20"></div>

      {/* Send Button - Restored with text */}
      <div className="flex justify-center">
        <button
          onClick={handleSendNft}
          disabled={isSending}
          style={{
            backgroundColor: "rgba(0, 255, 0, 0.1)",
            color: isSending ? "rgba(255, 255, 255, 0.5)" : "#00ff00",
            border: "1px solid rgba(0, 255, 0, 0.5)",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: isSending ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            fontSize: "16px",
            transition: "all 0.2s ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: isSending ? 0.6 : 1,
            width: "100%",
            height: "48px",
            boxShadow: "0 0 10px rgba(0, 255, 0, 0.2)"
          }}
          onMouseEnter={(e) => {
            if (!isSending) {
              e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
          }}
        >
          {isSending ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner />
              <span className="text-[#00ff00]">Sending...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send size={16} />
              <span>Send NFT</span>
            </div>
          )}
        </button>
      </div>

      <div className="h-4"></div>

      {/* Error/Success Messages - Matching AccountSend styling */}
      {sendError && (
        <div className="text-[#ff4d4d] text-sm text-center mt-4">
          {sendError}
        </div>
      )}
      {sendSuccess && (
        <div className="text-[#00ff00] text-sm text-center mt-4">
          Transaction successful!
        </div>
      )}
    </div>
  );
}; 
// src/widgets/account/ui/account-send.tsx

import React, { useState, useEffect } from 'react';
import { Send } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/shared/utils";
import { CoinBalanceItem } from './account-balance';
import { useAccountBalance } from '../model/use-balance';
import { useSuiPayment } from '@/widgets/chat/model/use-sui-payment';

interface AccountSendProps {
  address: string;
}

export const AccountSend: React.FC<AccountSendProps> = ({ address }) => {
  const { coins, loading } = useAccountBalance(address);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const { mutateAsync: sendSuiPayment } = useSuiPayment();

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

  // Get SUI balance from coins
  const suiBalance = coins.find(coin => coin.name === 'SUI')?.balance || 0;

  const inputClassName = cn(
    "w-full px-3 py-2 bg-transparent",
    "text-[#00ff00] font-mono text-base outline-none",
    "border-b border-[#00ff00]/20",
    "transition-colors focus:border-[#00ff00]",
    "text-base" // Ensure text is reasonably sized for mobile
  );

  const handlePercentageClick = (percentage: number) => {
    const calculatedAmount = (suiBalance * percentage).toFixed(6);
    setAmount(calculatedAmount);
  };

  const handleSend = async () => {
    if (!recipientAddress.trim()) {
      setSendError("Please enter a recipient address");
      return;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setSendError("Please enter a valid amount");
      return;
    }

    // Convert SUI amount to MIST (1 SUI = 1,000,000,000 MIST)
    // First multiply by 1e9 then floor to get rid of any decimals before converting to BigInt
    const amountInMist = Math.floor(Number(amount) * 1000000000);
    const mistAmountToSend = BigInt(amountInMist);

    if (mistAmountToSend > BigInt(Math.floor(suiBalance * 1000000000))) {
      setSendError("Insufficient balance");
      return;
    }

    setIsSending(true);
    setSendError("");

    try {
      await sendSuiPayment({
        recipient: recipientAddress,
        mistAmount: mistAmountToSend,
        onComplete: async () => {
          setSendSuccess(true);
          setRecipientAddress("");
          setAmount("");
          setTimeout(() => setSendSuccess(false), 5000);
        },
        onError: async (error: Error) => {
          console.error("Failed to send payment:", error);
          setSendError(error.message || "Failed to send SUI");
        },
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setSendError("Failed to send SUI");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-6 p-4">
      {/* Balance Display */}
      <div className="w-full rounded-2xl overflow-hidden">
        <CoinBalanceItem name="SUI" balance={suiBalance} />
      </div>

      <div className="h-20"></div>

      {/* Amount Input Section */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClassName}
            style={{ fontSize: '16px' }} // Prevent iOS zoom
          />
        </div>
        
        {/* Percentage Buttons */}
        <div className="flex gap-2 pt-2 justify-end">
          {[25, 50, 100].map((percentage) => (
            <button
              key={percentage}
              onClick={() => handlePercentageClick(percentage / 100)}
              className={cn(
                "px-3 py-1 rounded-full text-sm",
                "border border-[#00ff00]/30 text-[#00ff00]",
                "hover:bg-[#00ff00]/10 transition-colors"
              )}
            >
              {percentage === 100 ? 'Max' : `${percentage}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="h-20"></div>

      {/* Recipient Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className={inputClassName}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
      </div>
      


      <div className="h-20"></div>

      {/* Send Button */}
      <button
        onClick={handleSend}
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
            <Send size={16} />Send
          </div>
        )}
      </button>

      <div className="h-4"></div>

      {/* Error/Success Messages */}
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
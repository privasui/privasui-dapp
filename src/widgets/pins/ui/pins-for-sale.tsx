import React from 'react';
import { ShoppingCart, Clock, Send, Loader2 } from "lucide-react";
import { addToast } from '@/widgets/toast/model/use-toast';
import { useNamePurchase } from '../model/use-name-purchase';

interface PinsForSaleProps {
  searchName: string;
  piNSAddress: string;
  expirationDate: string | null;
  salePrice: string; // Price in SUI as string (e.g., "10.5")
  onChat: () => void;
  onPurchaseSuccess?: () => Promise<void>;
}

export const PinsForSale: React.FC<PinsForSaleProps> = ({
  searchName,
  piNSAddress,
  expirationDate,
  salePrice,
  onChat,
  onPurchaseSuccess
}) => {
  const namePurchase = useNamePurchase();
  
  // Price is already in SUI format (string), no conversion needed
  const priceInSui = parseFloat(salePrice);
  
  // Convert SUI to lamports for transaction (multiply by 1_000_000_000)
  const priceInLamports = Math.floor(priceInSui * 1_000_000_000);

  const handlePurchase = async () => {
    try {
      console.log(`🛒 [PinsForSale] Starting purchase for ${searchName} at ${priceInSui} SUI`);
      
      await namePurchase.mutateAsync({
        name: searchName.trim(),
        price: priceInLamports,
        onComplete: async () => {
          addToast.success(`Successfully purchased ${searchName.trim()}!`, 5000);
          
          console.log(`✅ [PinsForSale] Purchase successful for ${searchName}`);
          
          if (onPurchaseSuccess) {
            await onPurchaseSuccess();
          }
        },
        onError: (error) => {
          console.error(`❌ [PinsForSale] Purchase failed for ${searchName}:`, error);
          
          addToast.error(`Failed to purchase ${searchName.trim()}: ${addToast.formatError(error)}`, 5000);
        }
      });
      
    } catch (error) {
      console.error(`❌ [PinsForSale] Purchase failed for ${searchName}:`, error);
      
      addToast.error(`Failed to purchase ${searchName.trim()}. Please try again.`, 5000);
    }
  };

  return (
    <div className="border border-blue-500/50 bg-black rounded-xl p-6 shadow-lg transition-all">
      <div className="flex items-center mb-6">
        <ShoppingCart className="text-blue-500 flex-shrink-0 pr-2" size={24} />
        <h3 className="text-xl font-bold text-blue-500 font-mono">Available for Sale</h3>
      </div>
      
      <div className="text-gray-300 mb-6 font-mono text-sm pt-2">
        <p className="mb-4">
          The name <span className="text-blue-400 font-bold">{searchName.trim()}</span> is owned by address <span className="font-medium">{piNSAddress.substring(0, 6)}...{piNSAddress.substring(piNSAddress.length - 4)}</span> and is available for purchase.
        </p>
        
        {expirationDate && (
          <div className="flex items-center text-gray-400 mt-4 pt-2">
            <Clock className="flex-shrink-0" size={12} />
            <span className="pl-2">{expirationDate === "Lifetime registration" ? "Lifetime registration" : `Expires on ${expirationDate}`}</span>
          </div>
        )}
      </div>

      {/* Price Display */}
      <div className="text-center pb-6 pt-8">
        <p className="text-2xl font-bold text-blue-500 font-mono mb-2">
          {priceInSui.toFixed(2)} SUI
        </p>
        <p className="text-gray-400 text-sm font-mono">Sale Price</p>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center gap-8">
        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={namePurchase.isPending}
          className={`text-blue-500 font-mono font-bold text-base flex items-center gap-2 hover:text-blue-500/80 transition-colors border-b border-blue-500 pb-1 ${namePurchase.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {namePurchase.isPending ? (
            <Loader2 className="text-blue-500 flex-shrink-0 animate-spin" size={20} />
          ) : (
            <ShoppingCart className="text-blue-500 flex-shrink-0" size={20} />
          )}
          {namePurchase.isPending ? 'Purchasing...' : 'Buy now'}
        </button>

        {/* Chat Button */}
        <a
          onClick={onChat}
          className="text-[#00ff00] font-mono font-bold text-base flex items-center gap-2 hover:text-[#00ff00]/80 transition-colors cursor-pointer border-b border-[#00ff00] pb-1"
        >
          <Send className="text-[#00ff00] flex-shrink-0" size={20} />
          Chat with owner
        </a>
      </div>
    </div>
  );
}; 
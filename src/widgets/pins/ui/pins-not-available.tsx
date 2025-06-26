import React from 'react';
import { X, Clock, Send } from "lucide-react";
// No need to import extractPiNSName anymore since we only accept pure names

interface PinsNotAvailableProps {
  searchName: string;
  piNSAddress: string;
  expirationDate: string | null;
  onChat: () => void;
}

export const PinsNotAvailable: React.FC<PinsNotAvailableProps> = ({
  searchName,
  piNSAddress,
  expirationDate,
  onChat
}) => {
  return (
    <div className="border border-orange-500/50 bg-black rounded-xl p-6 shadow-lg transition-all">
      <div className="flex items-center mb-6">
        <X className="text-orange-500 flex-shrink-0 pr-2" size={24} />
        <h3 className="text-xl font-bold text-orange-500 font-mono">Not Available</h3>
      </div>
      
      <div className="text-gray-300 mb-6 font-mono text-sm pt-2">
        <p className="mb-4">
          The name <span className="text-orange-400 font-bold">{searchName.trim()}</span> is already registered by address <span className="font-medium">{piNSAddress.substring(0, 6)}...{piNSAddress.substring(piNSAddress.length - 4)}</span>
        </p>
        
        {expirationDate && (
          <div className="flex items-center text-gray-400 mt-4 pt-2">
            <Clock className="flex-shrink-0" size={12} />
            <span className="pl-2">{expirationDate === "Lifetime registration" ? "Lifetime registration" : `Expires on ${expirationDate}`}</span>
          </div>
        )}
      </div>
      
      {/* Start Chat Link */}
      <div className="flex justify-center py-3">
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

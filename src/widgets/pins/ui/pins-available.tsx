import React, { useState } from 'react';
import { Check, ShoppingBag, Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { useNameRegistration } from '@/widgets/pins/model/use-name-registration';
import { addToast } from '@/widgets/toast/model/use-toast';
// No need to import extractPiNSName anymore since we only accept pure names

interface PinsAvailableProps {
  searchName: string;
  lifetime: boolean;
  setLifetime: (isLifetime: boolean) => void;
  profilePrice: number;
  priceConfig: any;
}

export const PinsAvailable: React.FC<PinsAvailableProps> = ({
  searchName,
  lifetime,
  setLifetime,
  profilePrice,
  priceConfig
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const nameRegistration = useNameRegistration();

  const handleRegisterName = async () => {
    // Use the name directly (no extraction needed since we only accept pure names)
    const nameToRegister = searchName.trim();
    
    if (!nameToRegister) {
      addToast.error("Please enter a valid piNS name");
      return;
    }

    setIsRegistering(true);
    
    try {
      await nameRegistration.mutateAsync({
        name: nameToRegister,
        lifetime,
        price: profilePrice,
        onComplete: () => {
          addToast.success(`Successfully registered ${nameToRegister}`);
          setIsRegistering(false);
        },
        onError: (error: Error) => {
          addToast.error(`Registration failed: ${addToast.formatError(error)}`);
          setIsRegistering(false);
        }
      });
    } catch (error) {
      console.error('Name registration error:', error);
      setIsRegistering(false);
    }
  };

  const handleBuyClick = () => {
    handleRegisterName();
  };

  const isLoading = isRegistering || nameRegistration.isPending;

  return (
    <div className="border border-green-500/50 bg-black rounded-xl p-6 shadow-lg transition-all">
      <div className="flex items-center mb-6">
        <Check className="text-[#00ff00] flex-shrink-0 pr-2" size={24} />
        <h3 className="text-xl font-bold text-[#00ff00] font-mono">Available</h3>
      </div>
      
      <p className="text-gray-300 mb-8 font-mono text-sm pb-10 pt-2">
        The name <span className="text-[#00ff00] font-bold">{searchName.trim()}</span> is available for registration.
      </p>
      
      {/* Yearly/Lifetime toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-black border border-[#00ff00] rounded-full overflow-hidden">
          <ToggleGroup 
            type="single" 
            value={lifetime ? "lifetime" : "yearly"} 
            onValueChange={(value: string) => setLifetime(value === "lifetime")} 
            className="flex"
          >
            <ToggleGroupItem 
              value="yearly" 
              className="h-10 px-8 py-1 font-mono text-sm rounded-l-full rounded-r-none bg-black text-gray-500 hover:bg-black hover:text-white hover:cursor-pointer border-none data-[state=on]:bg-[#00ff0033] data-[state=on]:text-[#00ff00] data-[state=on]:font-bold data-[state=on]:text-base transition-all duration-200"
              disabled={isLoading}
            >
              Yearly
            </ToggleGroupItem>
            <div className="w-px bg-[#00ff00]" />
            <ToggleGroupItem 
              value="lifetime" 
              className="h-10 px-8 py-1 font-mono text-sm rounded-r-full rounded-l-none bg-black text-gray-500 hover:bg-black hover:text-white hover:cursor-pointer border-none data-[state=on]:bg-[#00ff0033] data-[state=on]:text-[#00ff00] data-[state=on]:font-bold data-[state=on]:text-base transition-all duration-200"
              disabled={isLoading}
            >
              Lifetime
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      {/* Price */}
      <div className="text-center pb-10">
        <p className="text-gray-400 text-sm font-mono mb-2 pt-2">Registration period</p>
        <p className="text-2xl font-bold text-[#00ff00] font-mono pt-10">
          {priceConfig ? `${(profilePrice / 1_000_000_000).toFixed(2)} SUI` : "Loading..."}
        </p>
      </div>
      
      {/* Buy Link */}
      <div className="flex justify-center py-3">
        <button
          onClick={handleBuyClick}
          disabled={!priceConfig || isLoading}
          className={`text-[#00ff00] font-mono font-bold text-base flex items-center gap-2 hover:text-[#00ff00]/80 transition-colors border-b border-[#00ff00] pb-1 ${!priceConfig || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            <Loader2 className="text-[#00ff00] flex-shrink-0 animate-spin" size={20} />
          ) : (
            <ShoppingBag className="text-[#00ff00] flex-shrink-0" size={20} />
          )}
          {isLoading ? 'Registering...' : 'Register name'}
        </button>
      </div>
    </div>
  );
};

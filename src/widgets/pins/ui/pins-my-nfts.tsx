import { useEffect, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import type { SuiClient } from "@mysten/sui/client";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { fetchDisplayObjectById, extractDisplayField, fetchPiNSDisplayConfig, getNameExpiration } from "@/shared/suipi";
import { PinsNftItem } from "./pins-nft-item";
import { getNetworkVariable } from "@/shared/network-config";

interface PinsMyNftsProps {
  showSendButton?: boolean;
  showSuiVision?: boolean;
  className?: string;
  title?: string;
}

const PINS_PACKAGE_ID_ORIGINAL = getNetworkVariable("PINS_PACKAGE_ID_ORIGINAL");

export const PinsMyNfts = ({
  showSendButton = true,
  showSuiVision = true,
  className = "",
  title = "My piNS"
}: PinsMyNftsProps) => {
  const { activeAccount } = useWalletAccountStore();
  const suiClient = useSuiClient();
  const [nfts, setNfts] = useState<any[]>([]);
  const [, setDisplayMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [expirations, setExpirations] = useState<Record<string, string>>({});

  const fetchPiNSNamesAndDisplays = async () => {
    if (!activeAccount?.publicKey) return;
    setLoading(true);
    try {
      // Fetch piNS display configuration
      const pinsDisplayObject = await fetchPiNSDisplayConfig(suiClient as unknown as SuiClient);
      
      // Define the piNS type we're looking for
      const piNSType = `${PINS_PACKAGE_ID_ORIGINAL}::name::PiNameOwnership`;
      
      // Set up display object map
      const displayMapTemp: Record<string, any> = {
        [piNSType]: null
      };
      
      // Get the display object
      if (pinsDisplayObject.pins_display_id) {
        const displayObj = await fetchDisplayObjectById(suiClient as unknown as SuiClient, pinsDisplayObject.pins_display_id);
        if (displayObj) displayMapTemp[piNSType] = displayObj;
      }
      
      setDisplayMap(displayMapTemp);
      
      // Fetch all objects owned by the user
      const resp = await suiClient.getOwnedObjects({
        owner: activeAccount.publicKey,
        options: { showType: true, showContent: true, showDisplay: true },
      });
      
      // Filter for piNS NFTs only
      const piNSObjects = resp.data.filter((obj: any) => {
        return obj.data?.type === piNSType;
      });
      
      console.log('[piNS DEBUG] Found piNS objects:', piNSObjects);
      
      // Fetch expiration dates for each piNS name
      const expirationsTemp: Record<string, string> = {};
      
      for (const nft of piNSObjects) {
        // Use type assertion to handle the complex structure
        const nftData = nft.data as any;
        if (nftData && nftData.content && nftData.content.fields && 
            'name' in nftData.content.fields && nftData.objectId) {
          const name = String(nftData.content.fields.name).replace('.pi', '');
          try {
            const expiration = await getNameExpiration(suiClient as unknown as SuiClient, name);
            if (expiration) {
              // Format the date
              const expirationDate = new Date(Number(expiration) * 1000);
              expirationsTemp[nftData.objectId] = expirationDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            } else {
              // If no expiration (lifetime registration)
              expirationsTemp[nftData.objectId] = "Never";
            }
          } catch (error) {
            console.error("Error fetching expiration:", error);
            expirationsTemp[nftData.objectId] = "Unknown";
          }
        }
      }
      
      setNfts(piNSObjects);
      setExpirations(expirationsTemp);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPiNSNamesAndDisplays();
  }, [activeAccount, suiClient]);

  const handleNftSent = () => {
    // Refresh the NFT list after an NFT is sent
    fetchPiNSNamesAndDisplays();
  };

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center pb-4 pt-4">
          <h2 className="text-xl font-bold text-primary font-mono">{title}</h2>
        </div>
      )}
      
      <div className="w-full overflow-auto max-h-[300px] border border-primary/15 flex flex-col rounded-2xl bg-black">
        {loading ? (
          <div className="w-full flex items-center justify-center py-8 text-primary font-mono">
            Loading piNS Names...
          </div>
        ) : nfts.length === 0 ? (
          <div className="w-full py-8 text-center text-gray-400 font-mono">
            No piNS Names found
          </div>
        ) : (
          nfts.map((nft) => {
            if (!nft.data) return null;
            
            // Use type assertion to handle the complex structure
            const nftData = nft.data as any;
            const fields = nftData.content?.fields;
            
            // Extract name from fields or display
            const name = extractDisplayField(nft, 'name') || (fields && 'name' in fields ? String(fields.name) : '');
            const piName = name.endsWith('.pi') ? name : `${name}.pi`;
            
            // Extract other display fields
            const imageUrl = extractDisplayField(nft, 'image_url');
            const thumbnailUrl = extractDisplayField(nft, 'thumbnail_url');
            
            // If we don't have an image URL from the display but have image data in fields
            const fallbackImage = !imageUrl && fields && 'image' in fields ? 
              `data:image/svg+xml;base64,${fields.image}` : undefined;
            
            const finalImageUrl = imageUrl || thumbnailUrl || fallbackImage || 'https://placehold.co/96x96/4CAF50/FFFFFF?text=piNS';
            
            // Get expiration date
            const expiration = expirations[nftData.objectId] || "Unknown";

            return (
              <PinsNftItem
                key={nftData.objectId}
                nft={nft}
                expiration={expiration}
                finalImageUrl={finalImageUrl}
                piName={piName}
                onNftSent={handleNftSent}
                showSendButton={showSendButton}
                showSuiVision={showSuiVision}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

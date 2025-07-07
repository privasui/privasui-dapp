import { useEffect, useState, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import type { SuiClient } from "@mysten/sui/client";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { extractDisplayField, getNameExpiration } from "@/shared/suipi";
import { PinsNftItem } from "./pins-nft-item";
import { getNetworkVariable } from "@/shared/network-config";

interface PinsMyNftsProps {
  showSendButton?: boolean;
  showSellButton?: boolean;
  showSuiVision?: boolean;
  className?: string;
  title?: string;
  onRefresh?: (refreshFn: () => void) => void;
}

interface PiNSNftData {
  objectId: string;
  name: string;
  piName: string;
  imageUrl: string;
  expiration: string;
  version: number;
  rawData: any;
}

const PINS_PACKAGE_ID_ORIGINAL = getNetworkVariable("PINS_PACKAGE_ID_ORIGINAL");
const PINS_TYPE = `${PINS_PACKAGE_ID_ORIGINAL}::name::PiNameOwnership`;

const formatPiName = (rawName: string): { name: string; piName: string } => {
  // Trim whitespace and convert to lowercase
  const cleanName = rawName.trim().toLowerCase();
  
  // Remove .pi extension if present
  const baseName = cleanName.endsWith('.pi') ? 
    cleanName.slice(0, -3) : cleanName;
    
  // Validate name (add more validation as needed)
  if (!baseName || /[^a-z0-9-]/.test(baseName)) {
    throw new Error(`Invalid piNS name: ${rawName}`);
  }
  
  return {
    name: baseName,
    piName: `${baseName}.pi`
  };
};

const formatExpirationDate = (timestamp: string | null): string => {
  if (!timestamp) return "Never";
  
  try {
    // Convert to number and handle as milliseconds
    const expMs = Number(timestamp);
    if (isNaN(expMs)) {
      console.warn("[PiNS] Invalid timestamp:", timestamp);
      return "Invalid Date";
    }

    console.log(`[PiNS Debug] Formatting expiration:`, {
      raw_timestamp: timestamp,
      parsed_ms: expMs,
      as_date: new Date(expMs).toISOString()
    });
    
    const date = new Date(expMs); // Use milliseconds directly
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return "Expired";
    if (days === 1) return "Tomorrow";
    if (days < 30) return `in ${days} days`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('[PiNS] Error formatting expiration date:', error);
    return "Unknown";
  }
};

export const PinsMyNfts = ({
  showSendButton = true,
  showSellButton = true,
  showSuiVision = true,
  className = "",
  title = "My piNS",
  onRefresh
}: PinsMyNftsProps) => {
  const { activeAccount } = useWalletAccountStore();
  const suiClient = useSuiClient();
  const [nfts, setNfts] = useState<PiNSNftData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractNftData = useCallback(async (nft: any): Promise<PiNSNftData | null> => {
    try {
      const nftData = nft.data;
      if (!nftData?.content?.fields?.name || !nftData.objectId) return null;

      // Format and validate piName
      const { name, piName } = formatPiName(nftData.content.fields.name);

      // Extract image URL with fallbacks
      const imageUrl = extractDisplayField(nft, 'image_url') || 
                      extractDisplayField(nft, 'thumbnail_url') ||
                      (nftData.content.fields.image ? 
                        `data:image/svg+xml;base64,${nftData.content.fields.image}` : 
                        'https://placehold.co/96x96/4CAF50/FFFFFF?text=piNS');

      // Fetch expiration
      const expiration = await getNameExpiration(suiClient as unknown as SuiClient, name);
      const expirationFormatted = formatExpirationDate(expiration);

      return {
        objectId: nftData.objectId,
        name,
        piName,
        imageUrl,
        expiration: expirationFormatted,
        version: nftData.version ? parseInt(nftData.version) : 0,
        rawData: nft
      };
    } catch (error) {
      console.error(`Error processing NFT:`, error);
      return null;
    }
  }, [suiClient]);

  const fetchPiNSNamesAndDisplays = useCallback(async () => {
    if (!activeAccount?.publicKey) {
      setError("No active account found");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch owned objects
      const resp = await suiClient.getOwnedObjects({
        owner: activeAccount.publicKey,
        options: { showType: true, showContent: true, showDisplay: true },
      });

      // Filter and process PiNS NFTs in parallel
      const piNSObjects = resp.data.filter(obj => obj.data?.type === PINS_TYPE);
      const processedNfts = await Promise.all(
        piNSObjects.map(nft => extractNftData(nft))
      );

      // Filter out nulls and sort by version
      const validNfts = processedNfts.filter((nft): nft is PiNSNftData => nft !== null)
        .sort((a, b) => b.version - a.version);

      setNfts(validNfts);
    } catch (error) {
      console.error('Error fetching PiNS NFTs:', error);
      setError("Failed to fetch PiNS names");
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [activeAccount?.publicKey, suiClient, extractNftData]);

  useEffect(() => {
    fetchPiNSNamesAndDisplays();
  }, [fetchPiNSNamesAndDisplays]);

  useEffect(() => {
    if (onRefresh) {
      onRefresh(fetchPiNSNamesAndDisplays);
    }
  }, [onRefresh, fetchPiNSNamesAndDisplays]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="w-full py-8 text-center text-red-400 font-mono">
          <div className="mb-4">{error}</div>
          <button
            onClick={fetchPiNSNamesAndDisplays}
            className="text-[#00ff00] hover:text-[#00ff00]/80 transition-colors border border-[#00ff00]/30 px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[48px_1fr_auto] gap-4 items-center h-20 w-full px-4 py-4 border-b border-[#00ff00]/10 hover:bg-[#00ff00]/5">
              <div className="w-12 h-12 bg-[#00ff00]/5 animate-pulse rounded-lg" />
              <div className="pt-1">
                <div className="h-5 bg-[#00ff00]/5 animate-pulse rounded-lg w-3/4" />
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#00ff00]/5 animate-pulse rounded-lg" />
                <div className="w-8 h-8 bg-[#00ff00]/5 animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (nfts.length === 0) {
      return (
        <div className="w-full py-8 text-center text-gray-400 font-mono">
          <div className="text-4xl mb-4">🏷️</div>
          <div className="text-lg mb-2">No piNS Names found</div>
          <div className="text-sm text-gray-500">
            Register your first piNS name to get started
          </div>
        </div>
      );
    }

    return (
      <div className="divide-y divide-primary/10">
        {nfts.map(nft => (
          <PinsNftItem
            key={nft.objectId}
            nft={nft.rawData}
            expiration={nft.expiration}
            finalImageUrl={nft.imageUrl}
            piName={nft.piName}
            onNftSent={fetchPiNSNamesAndDisplays}
            showSendButton={showSendButton}
            showSellButton={showSellButton}
            showSuiVision={showSuiVision}
            loading={loading}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center justify-between pb-4 pt-4">
          <h2 className="text-xl font-bold text-primary font-mono">{title}</h2>
          <div className="text-sm text-primary/60 font-mono">
            {nfts.length} {nfts.length === 1 ? 'name' : 'names'}
          </div>
        </div>
      )}
      
      <div className="w-full overflow-auto max-h-[300px] border border-primary/15 flex flex-col rounded-2xl bg-black">
        {renderContent()}
      </div>
    </div>
  );
};

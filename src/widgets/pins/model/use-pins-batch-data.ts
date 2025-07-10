import { useCallback } from 'react';
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient, type SuiObjectResponse } from '@mysten/sui/client';
import { getNetworkVariable } from '@/shared/network-config';
import { getPiNameData, PiNameData } from '@/shared/suipi';

const PINS_PACKAGE_ID_ORIGINAL = getNetworkVariable("PINS_PACKAGE_ID_ORIGINAL");

export interface PiNSNftData {
  objectId: string;
  name: string;
  piName: string;
  imageUrl: string;
  finalImageUrl: string;
  expiration: string;
  version: string;
  salePrice: string | null;
  rawData: SuiObjectResponse;
  piNameData: PiNameData;
}

const formatExpirationDate = (expirationMs: string | undefined): string => {
  if (!expirationMs) return "Never";

  const now = Date.now();
  const expMs = Number(expirationMs);
  
  console.log(`\n🕒 [PiNS Debug] Formatting expiration for timestamp ${expirationMs}:`, {
    raw_expiration: expirationMs,
    parsed_number: expMs,
    current_time: now,
    current_time_iso: new Date(now).toISOString(),
    difference_ms: expMs - now,
    difference_days: Math.ceil((expMs - now) / (1000 * 60 * 60 * 24))
  });

  if (isNaN(expMs)) {
    console.error("❌ [PiNS Debug] Invalid expiration timestamp:", expirationMs);
    return "Invalid Date";
}

  // Validate timestamp length and adjust if needed
  const timestampStr = expirationMs.toString();
  let adjustedExpMs = expMs;
  
  // If timestamp is too short (seconds instead of milliseconds)
  if (timestampStr.length <= 10) {
    adjustedExpMs = expMs * 1000;
  }
  
  const expirationDate = new Date(adjustedExpMs);
  
  if (isNaN(expirationDate.getTime())) {
    console.error("❌ [PiNS Debug] Invalid Date object:", expirationDate);
    return "Invalid Date";
  }

  console.log(`📅 [PiNS Debug] Date conversion details:`, {
    original_timestamp: expirationMs,
    adjusted_timestamp: adjustedExpMs,
    date_object: expirationDate,
    formatted_iso: expirationDate.toISOString()
  });

  const diffDays = Math.ceil((adjustedExpMs - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Expired";
  if (diffDays === 1) return "Expires Tomorrow";
  if (diffDays < 30) return `Expires in ${diffDays} days`;

  return `Expires ${expirationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })}`;
};

export const usePinsBatchData = () => {
  const suiClient = useSuiClient();

  const fetchPiNSBatchData = useCallback(async (
    activeAccount: string
  ): Promise<PiNSNftData[]> => {
    if (!activeAccount) return [];

    try {
      console.log("🔍 [PiNS] Fetching NFTs for account:", activeAccount);
      
      const piNSType = `${PINS_PACKAGE_ID_ORIGINAL}::name::PiNameOwnership`;
      const resp = await suiClient.getOwnedObjects({
        owner: activeAccount,
        options: { showType: true, showContent: true, showDisplay: true },
      });
      
      const piNSObjects = resp.data.filter((obj: SuiObjectResponse) => 
        obj.data?.type === piNSType
      );

      console.log(`🔍 [PiNS] Found ${piNSObjects.length} PiNS NFTs`);

      // Process all NFTs in parallel
      const processedNfts = await Promise.all(piNSObjects.map(async (nft) => {
        const nftData = nft.data as any;
        const fields = nftData.content?.fields;
        
        if (!fields?.name || !nftData.objectId) {
          console.warn("⚠️ [PiNS] Skipping NFT with missing data:", nftData);
          return null;
        }

        const name = String(fields.name).replace('.pi', '');
        console.log(`\n📦 [PiNS] Processing NFT:`, {
            objectId: nftData.objectId,
          name: name,
          type: nftData.type,
          version: nftData.version,
        });
        
        try {
          // Fetch complete PiName data - this uses the cache we just added
          const piNameData = await getPiNameData(suiClient as unknown as SuiClient, name);
          
          if (!piNameData) {
            console.warn(`⚠️ [PiNS] No PiName data found for ${name}`);
            return null;
        }

          console.log(`\n⏰ [PiNS Debug] Raw PiName data for ${name}:`, {
            expiration_ms: piNameData.expiration_ms,
            created_at: piNameData.created_at
          });

          // Format expiration date using the new helper function
          const formattedExpiration = formatExpirationDate(piNameData.expiration_ms);
        
        // Extract image URL
        const imageUrl = nft.data?.display?.data?.image_url;
        const fallbackImage = fields?.image ? 
          `data:image/svg+xml;base64,${fields.image}` : undefined;
        const finalImageUrl = imageUrl || fallbackImage || 
          'https://placehold.co/96x96/4CAF50/FFFFFF?text=piNS';

          const processedNft: PiNSNftData = {
          objectId: nftData.objectId,
          name,
            piName: name.endsWith('.pi') ? name : `${name}.pi`,
            imageUrl: finalImageUrl,
          finalImageUrl,
            expiration: formattedExpiration,
            version: nftData.version?.toString() || "0",
            salePrice: "10", // Placeholder until sale price feature is implemented
            rawData: nft,
            piNameData
          };

          console.log(`✅ [PiNS] Processed NFT Data for ${name}:`, {
            name: processedNft.name,
            expiration: processedNft.expiration,
            raw_expiration: piNameData.expiration_ms
          });
          return processedNft;
          
        } catch (error) {
          console.error(`❌ [PiNS] Error processing ${name}:`, error);
          return null;
        }
      }));

      // Filter out null entries and sort by version
      const validNfts = processedNfts
        .filter((nft): nft is NonNullable<typeof nft> => nft !== null)
        .sort((a, b) => parseInt(b.version) - parseInt(a.version));

      console.log(`\n📋 [PiNS] Final processed NFTs (${validNfts.length}):`, validNfts);
      return validNfts;

    } catch (error) {
      console.error('❌ [PiNS] Error fetching PiNS batch data:', error);
      throw error;
    }
  }, [suiClient]);

  return { fetchPiNSBatchData };
}; 
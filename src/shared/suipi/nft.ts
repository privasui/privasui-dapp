import type { SuiClient, SuiObjectResponse, SuiObjectData, SuiMoveObject } from "@mysten/sui/client";
import { extractDisplayField } from "./display";
import { getNetworkVariable } from "@/shared/network-config";
import { getNameExpiration } from "./pins";

// Base NFT interface that can be extended for specific NFT types
export interface BaseNftData {
  objectId: string;
  type: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  version: string;
  rawData: SuiObjectData;
}

// PiNS specific NFT interface
export interface PiNSNftData extends BaseNftData {
  piName: string;
  expiration: string;
}

// Constants
export const PINS_PACKAGE_ID = getNetworkVariable("PINS_PACKAGE_ID_ORIGINAL");
export const PINS_TYPE = `${PINS_PACKAGE_ID}::name::PiNameOwnership`;

/**
 * Generic function to fetch NFTs for an owner
 */
export const fetchNFTs = async (
  suiClient: SuiClient,
  ownerAddress: string,
  options?: {
    type?: string;
    limit?: number;
  }
): Promise<SuiObjectResponse[]> => {
  try {
    const resp = await suiClient.getOwnedObjects({
      owner: ownerAddress,
      options: { showType: true, showContent: true, showDisplay: true },
      limit: options?.limit,
    });

    if (options?.type) {
      return resp.data.filter(obj => obj.data?.type === options.type);
    }

    return resp.data;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
};

/**
 * Extract basic NFT data that's common across different NFT types
 */
export const extractBaseNftData = (
  nft: SuiObjectResponse
): BaseNftData | null => {
  try {
    const nftData = nft.data;
    if (!nftData?.objectId || !nftData.type) return null;

    return {
      objectId: nftData.objectId,
      type: nftData.type,
      name: extractDisplayField(nft, 'name'),
      description: extractDisplayField(nft, 'description'),
      imageUrl: extractDisplayField(nft, 'image_url') || 
                extractDisplayField(nft, 'thumbnail_url'),
      version: nftData.version?.toString() || "0",
      rawData: nftData
    };
  } catch (error) {
    console.error('Error extracting base NFT data:', error);
    return null;
  }
};

/**
 * Format and validate piName
 */
export const formatPiName = (rawName: string): { name: string; piName: string } => {
  const cleanName = rawName.trim().toLowerCase();
  const baseName = cleanName.endsWith('.pi') ? cleanName.slice(0, -3) : cleanName;
    
  if (!baseName || /[^a-z0-9-]/.test(baseName)) {
    throw new Error(`Invalid piNS name: ${rawName}`);
  }
  
  return {
    name: baseName,
    piName: `${baseName}.pi`
  };
};

/**
 * Format expiration timestamp into human readable format
 */
export const formatExpirationDate = (timestamp: string | null): string => {
  if (!timestamp) return "Never";
  
  try {
    // The timestamp is already in milliseconds from the blockchain
    const timestampMs = Number(timestamp);
    
    const date = new Date(timestampMs);
    if (isNaN(date.getTime())) return "Never";
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return "Expired";
    if (days === 1) return "Expires Tomorrow";
    if (days < 30) return `Expires in ${days} days`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting expiration date:', error);
    return "Unknown";
  }
};

/**
 * Extract PiNS specific NFT data
 */
export const extractPiNSNftData = async (
  suiClient: SuiClient,
  nft: SuiObjectResponse
): Promise<PiNSNftData | null> => {
  try {
    const baseData = extractBaseNftData(nft);
    if (!baseData || baseData.type !== PINS_TYPE) return null;

    const nftData = nft.data;
    if (!nftData?.content || !('fields' in nftData.content)) return null;
    
    const content = nftData.content as SuiMoveObject;
    const fields = content.fields as Record<string, any>;
    
    if (!fields.name || typeof fields.name !== 'string') return null;

    // Format and validate piName
    const { name, piName } = formatPiName(fields.name);

    // Get expiration
    const expirationMs = await getNameExpiration(suiClient, name);
    const expiration = formatExpirationDate(expirationMs);

    // Set default image if none exists
    const imageUrl = baseData.imageUrl || 
      (fields.image && typeof fields.image === 'string' ? 
        `data:image/svg+xml;base64,${fields.image}` : 
        'https://placehold.co/96x96/4CAF50/FFFFFF?text=piNS');

    return {
      ...baseData,
      piName,
      imageUrl,
      expiration,
    };
  } catch (error) {
    console.error('Error extracting PiNS NFT data:', error);
    return null;
  }
};

/**
 * Fetch all PiNS NFTs for an owner
 */
export const fetchPiNSNfts = async (
  suiClient: SuiClient,
  ownerAddress: string
): Promise<PiNSNftData[]> => {
  try {
    // Fetch PiNS NFTs
    const nfts = await fetchNFTs(suiClient, ownerAddress, { type: PINS_TYPE });

    // Process NFTs in parallel
    const processedNfts = await Promise.all(
      nfts.map(nft => extractPiNSNftData(suiClient, nft))
    );

    // Filter nulls and sort by version
    return processedNfts
      .filter((nft): nft is PiNSNftData => nft !== null)
      .sort((a, b) => parseInt(b.version) - parseInt(a.version));

  } catch (error) {
    console.error('Error fetching PiNS NFTs:', error);
    throw error;
  }
};

/**
 * Check if an object is a PiNS NFT
 */
export const isPiNSNft = (obj: SuiObjectResponse): boolean => {
  return obj.data?.type === PINS_TYPE;
};

/**
 * Get NFT metadata URL if available
 */
export const getNftMetadataUrl = (nft: SuiObjectResponse): string | undefined => {
  return extractDisplayField(nft, 'metadata_url');
};

/**
 * Get NFT attributes/properties if available
 */
export const getNftAttributes = (nft: SuiObjectResponse): Record<string, any> | undefined => {
  const attributes = extractDisplayField(nft, 'attributes');
  if (attributes && typeof attributes === 'string') {
    try {
      return JSON.parse(attributes);
    } catch {
      return undefined;
    }
  }
  return undefined;
}; 
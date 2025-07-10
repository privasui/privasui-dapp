import { SuiClient } from '@mysten/sui/client';
import { getItemRegistryDataWithStringKey, getPackageItemRegistry, hasItemRegistryDataWithStringKey, PackagesEnum } from './pir';

export interface PiNameData {
  name: string;
  owner: string;
  ownership_id: string;
  nft_id?: string;
  expiration_ms?: string;
  address?: string;
  data?: Record<string, string>;
  created_at: string;
}

// Cache for PiName data to prevent duplicate fetches
const piNameCache: Record<string, { data: PiNameData | null; timestamp: number }> = {};
const CACHE_DURATION = 30000; // 30 seconds cache

// Function to invalidate cache for a specific name or all names
export const invalidatePiNameCache = (name?: string) => {
  if (name) {
    delete piNameCache[name];
    console.log(`🗑️ [PiNS Cache] Invalidated cache for ${name}`);
  } else {
    // Clear all cache
    Object.keys(piNameCache).forEach(key => delete piNameCache[key]);
    console.log(`🗑️ [PiNS Cache] Invalidated all cache`);
}
};

// Utility functions for SUI/lamports conversion
export const suiToLamports = (sui: number): number => {
  return Math.floor(sui * 1_000_000_000);
};

export const lamportsToSui = (lamports: number | string): number => {
  const lamportsNum = typeof lamports === 'string' ? parseInt(lamports) : lamports;
  return lamportsNum / 1_000_000_000;
};

export const formatSuiPrice = (lamports: number | string): string => {
  const sui = lamportsToSui(lamports);
  return sui.toFixed(2);
};

export const getPiNamePrice = async (suiClient: any, name: string): Promise<string | null> => {
  try {
    const data = await getPiNameData(suiClient, name);
    if (!data?.data) return null;

    // Price is stored in the data VecMap with key "price" in lamports
    const priceLamports = data.data["price"];
    console.log(`💰 [PiNS Debug] Price data for ${name}:`, {
      has_data: !!data.data,
      raw_price_lamports: priceLamports,
      data_keys: Object.keys(data.data)
    });
    
    if (!priceLamports) return null;
    
    // Convert lamports to SUI and return as formatted string
    const priceInSui = formatSuiPrice(priceLamports);
    console.log(`💰 [PiNS Debug] Price conversion for ${name}:`, {
      lamports: priceLamports,
      sui: priceInSui
    });
    
    return priceInSui;
  } catch (error) {
    console.error(`❌ [PiNS Debug] Error getting price for ${name}:`, error);
    return null;
  }
};

export const getPiNameData = async (suiClient: any, name: string): Promise<PiNameData | null> => {
  try {
    // Check cache first
    const now = Date.now();
    const cached = piNameCache[name];
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`🎯 [PiNS Debug] Using cached data for ${name}`);
      return cached.data;
    }

    console.log(`\n🔍 [PiNS Debug] Fetching PiName data for: ${name}`);
    const {id: nameRegistryObjId } = await getPackageItemRegistry(suiClient, PackagesEnum.PINS, "name::NameRegistry");
    console.log(`📦 [PiNS Debug] Using NameRegistry ID: ${nameRegistryObjId}`);
    
    let piNSData = await getItemRegistryDataWithStringKey(suiClient, nameRegistryObjId, name);
    
    if (!piNSData) {
      console.log(`❌ [PiNS Debug] No data found for name: ${name}`);
      piNameCache[name] = { data: null, timestamp: now };
      return null;
    }
    
    console.log(`\n📄 [PiNS Debug] Raw PiNS data for ${name}:`, JSON.stringify(piNSData, null, 2));
    
    const fields = piNSData.value.fields;
    
    // Process VecMap data into a regular object
    let processedData: Record<string, string> | undefined;
    if (fields.data?.fields?.contents) {
      processedData = {};
      const vecMap = fields.data.fields.contents;
      if (Array.isArray(vecMap)) {
        for (const entry of vecMap) {
          if (entry.fields) {
            processedData[entry.fields.key] = entry.fields.value;
          }
        }
      }
      console.log(`\n📝 [PiNS Debug] Processed VecMap data for ${name}:`, processedData);
    }
    
    // Return the complete PiName data
    const result = {
      name: fields.name,
      owner: fields.owner,
      ownership_id: fields.ownership_id,
      nft_id: fields.nft_id || undefined,
      expiration_ms: fields.expiration_ms || undefined,
      address: fields.address || undefined,
      data: processedData,
      created_at: fields.created_at,
    };
    
    console.log(`\n✅ [PiNS Debug] Processed PiName data for ${name}:`, result);
    
    // Cache the result
    piNameCache[name] = { data: result, timestamp: now };
    return result;
    
  } catch (error) {
    console.error(`❌ [PiNS Debug] Error getting PiName data for ${name}:`, error);
    return null;
  }
};

export const isNameAvailable = async (suiClient: SuiClient, name: string): Promise<boolean> => {    
    const data = await getPiNameData(suiClient, name);
    return !data;
}

export const getNameAddress = async (suiClient: SuiClient, name: string): Promise<string | null> => {
  const data = await getPiNameData(suiClient, name);
  return data?.address || null;
}

export const getNameExpiration = async (suiClient: SuiClient, name: string): Promise<string | null> => {
  const data = await getPiNameData(suiClient, name);
  if (data?.expiration_ms) {
    console.log(`\n⏰ [PiNS Debug] getNameExpiration for ${name}:`, {
      raw_expiration: data.expiration_ms,
      parsed_number: Number(data.expiration_ms),
      date_string: new Date(Number(data.expiration_ms)).toISOString(),
      timestamp_length: data.expiration_ms.length,
      is_valid_date: !isNaN(new Date(Number(data.expiration_ms)).getTime())
    });
  } else {
    console.log(`\n⏰ [PiNS Debug] No expiration for ${name} (lifetime registration)`);
  }
  return data?.expiration_ms || null;
}

export const hasAddressName = async (suiClient: SuiClient, address: string): Promise<boolean> => {
    const {id: addressRegistryObjId } = await getPackageItemRegistry(suiClient, PackagesEnum.PINS, "address::AddressRegistry");
    return hasItemRegistryDataWithStringKey(suiClient, addressRegistryObjId, address);
}

export const fetchPiNSDisplayConfig = async (suiClient: SuiClient): Promise<any>  => {
    const { value: displayRegistryValue } = await getPackageItemRegistry(suiClient, PackagesEnum.PINS, "display::DisplayRegistry");
    let displays: any = {};
  
    //@ts-ignore
    const vecMap = displayRegistryValue?.fields?.displays?.fields?.contents;
  
    if (!Array.isArray(vecMap)) {
      throw new Error("Invalid vec_map format");
    }
  
    for (const entry of vecMap) {
      const key = entry.fields.key;
      const value = entry.fields.value;
      displays[key] = value;
    }
  
    return displays;
}
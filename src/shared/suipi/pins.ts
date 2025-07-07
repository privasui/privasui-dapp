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

export const getPiNameData = async (suiClient: SuiClient, name: string): Promise<PiNameData | null> => {
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
    console.log(`\n⏰ [PiNS Debug] Expiration fields for ${name}:`, {
      raw_expiration: fields.expiration_ms,
      has_expiration: !!fields.expiration_ms,
      type: fields.expiration_ms ? typeof fields.expiration_ms : 'undefined'
    });
    
    // Return the complete PiName data
    const processedData = {
      name: fields.name,
      owner: fields.owner,
      ownership_id: fields.ownership_id,
      nft_id: fields.nft_id || undefined,
      // expiration_ms comes directly as a string, not in fields.value
      expiration_ms: fields.expiration_ms || undefined,
      address: fields.address || undefined,
      data: fields.data || undefined,
      created_at: fields.created_at,
    };
    
    console.log(`\n✅ [PiNS Debug] Processed PiName data for ${name}:`, processedData);
    
    // Cache the result
    piNameCache[name] = { data: processedData, timestamp: now };
    return processedData;
    
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
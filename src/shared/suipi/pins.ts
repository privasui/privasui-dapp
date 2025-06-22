import { SuiClient } from '@mysten/sui/client';
import { getItemRegistryDataWithStringKey, getPackageItemRegistry, hasItemRegistryDataWithStringKey, PackagesEnum } from './pir';

export const isNameAvailable = async (suiClient: SuiClient, name: string): Promise<any> => {    
    console.log("🔍 [PINS] isNameAvailable name:", name);
    const {id: nameRegistryObjId } = await getPackageItemRegistry(suiClient, PackagesEnum.PINS, "name::NameRegistry");
    let piNSData = await getItemRegistryDataWithStringKey(suiClient, nameRegistryObjId, name);
    console.log(`🔍 [PINS] piNSData for ${name}:`, piNSData);
    return !piNSData;
}

export const hasAddressName = async (suiClient: SuiClient, address: string): Promise<any> => {
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
      displays[key] = value; // or Number(value) if you're okay with potential overflow
    }
  
    return displays;
}
import { SuiClient } from '@mysten/sui/client';
import { getItemRegistryDataWithAddressKey, getPackageItemRegistry, PackagesEnum } from './pir';
import { Avatar } from '../types';

export interface ProfileInfo {
  name: string;
  nft_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  about: string | null;
  avatar: Avatar | null;
}

export const fetchPriceConfig = async (suiClient: SuiClient): Promise<any>  => {
    const { value: priceRegistryValue } = await getPackageItemRegistry(suiClient, PackagesEnum.PRIVASUI, "price::PriceRegistry");
    let prices: any = {};
  
    //@ts-ignore
    const vecMap = priceRegistryValue?.fields?.prices?.fields?.contents;
  
    if (!Array.isArray(vecMap)) {
      throw new Error("Invalid vec_map format");
    }
  
    for (const entry of vecMap) {
      const key = entry.fields.key;
      const value = entry.fields.value;
      prices[key] = BigInt(value); // or Number(value) if you're okay with potential overflow
    }
  
    return prices;
}

export const fetchProfileByAddress = async (suiClient: SuiClient, address: string): Promise<any> => {
  const {id: profileRegistryId } = await getPackageItemRegistry(suiClient, PackagesEnum.PRIVASUI, "profile::ProfileRegistry");
  let profile = await getItemRegistryDataWithAddressKey(suiClient, profileRegistryId, address);
  return profile;
}

export const fetchAvatarId = async (suiClient: SuiClient, avatarId: string): Promise<Avatar | null> => {
    const avatarResponse = await suiClient.getObject({
      id: avatarId,
      options: {
        showContent: true
      }
    });
    
    if(!avatarResponse || !avatarResponse.data?.content || !('fields' in avatarResponse.data.content)){
      return null;
    }
  
    const fields = avatarResponse.data.content.fields as any;
  
    return {
      id: fields.id.id,
      name: fields.name,
      image: fields.image,
      owner: fields.owner,
    } as Avatar;
}

export const fetchUserProfileInfo = async (suiClient: SuiClient, address: string): Promise<ProfileInfo | null> => {
  const profile = await fetchProfileByAddress(suiClient, address);

  if(!profile){
    return null;
  }

  let profileInfo: ProfileInfo = {
    name: profile.value.fields.name,
    nft_id: profile.value.fields.nft_id,
    owner: profile.value.fields.owner,
    created_at: profile.value.fields.created_at,
    updated_at: profile.value.fields.updated_at,
    about: profile.value.fields.about,
    avatar: null, 
  }

  let avatarNftId = profile.value.fields.nft_id;

  if(avatarNftId) {
    let avatarNFT = await fetchAvatarId(suiClient, avatarNftId);
    profileInfo.avatar = avatarNFT;
  }

  return profileInfo;
}

export const fetchDisplayConfig = async (suiClient: SuiClient): Promise<any>  => {
  const { value: displayRegistryValue } = await getPackageItemRegistry(suiClient, PackagesEnum.PRIVASUI, "display::DisplayRegistry");
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
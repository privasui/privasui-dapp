
import { SuiClient } from '@mysten/sui/client';
import { getNetworkVariable } from '@/shared/network-config';

const PI_OBJECT_ID = getNetworkVariable("PI_OBJECT_ID");
const PIR_PACKAGE_ID_ORIGINAL = getNetworkVariable("PIR_PACKAGE_ID_ORIGINAL");
const PIM_PACKAGE_ID_ORIGINAL = getNetworkVariable("PIM_PACKAGE_ID_ORIGINAL");
const PINS_PACKAGE_ID_ORIGINAL = getNetworkVariable("PINS_PACKAGE_ID_ORIGINAL");
const PIX_PACKAGE_ID_ORIGINAL = getNetworkVariable("PIX_PACKAGE_ID_ORIGINAL");
const PRIVASUI_PACKAGE_ID_ORIGINAL = getNetworkVariable("PRIVASUI_PACKAGE_ID_ORIGINAL");

export enum PackagesEnum {
    PIR = "PIR",
    PINS = "PINS",
    PIM = "PIM",
    PIX = "PIX",
    PRIVASUI = "PRIVASUI",
}

export const getPackageId = (packageName: PackagesEnum): string => {
    switch(packageName){
        case PackagesEnum.PIR:
            return PIR_PACKAGE_ID_ORIGINAL;
        case PackagesEnum.PINS:
            return PINS_PACKAGE_ID_ORIGINAL;
        case PackagesEnum.PIM:
            return PIM_PACKAGE_ID_ORIGINAL;
        case PackagesEnum.PIX:
            return PIX_PACKAGE_ID_ORIGINAL;
        case PackagesEnum.PRIVASUI:
            return PRIVASUI_PACKAGE_ID_ORIGINAL;
        default:
            throw new Error(`Invalid package name: ${packageName}`);
    }
}

export const getPackageRegistryType = (packageName: PackagesEnum): string => {
    switch(packageName){
        case PackagesEnum.PIM:
            return `${PIR_PACKAGE_ID_ORIGINAL}::registry::CallerKey<${PIM_PACKAGE_ID_ORIGINAL}::caller::PIM>`;
        case PackagesEnum.PINS:
            return `${PIR_PACKAGE_ID_ORIGINAL}::registry::CallerKey<${PINS_PACKAGE_ID_ORIGINAL}::caller::PINS>`;
        case PackagesEnum.PIX:
            return `${PIR_PACKAGE_ID_ORIGINAL}::registry::CallerKey<${PIX_PACKAGE_ID_ORIGINAL}::caller::PIX>`;
        case PackagesEnum.PRIVASUI:
            return `${PIR_PACKAGE_ID_ORIGINAL}::registry::CallerKey<${PRIVASUI_PACKAGE_ID_ORIGINAL}::caller::PRIVASUI>`;
        default:
            throw new Error(`Invalid package name: ${packageName}`);
    }
}

export const getPackageRegistryObjectId = async (suiClient: SuiClient, packageName: PackagesEnum): Promise<string> => {
    const packageRegistryType = getPackageRegistryType(packageName);
    
    const callerRegistryDynamicFieldObj = await suiClient.getDynamicFieldObject({
        parentId: PI_OBJECT_ID,
        name: {
          type: packageRegistryType,
          value: { dummy_field: false },
        },
      });
    
      if(!callerRegistryDynamicFieldObj){
        throw new Error(`Caller registry dynamic field object not found for package: ${packageName}`);
      }

    //@ts-ignore
    const callerRegistryObjId = callerRegistryDynamicFieldObj.data?.content?.fields?.value?.fields?.id?.id;

    return callerRegistryObjId;
}


export interface DynItem {
    id: string;
    value: any;
}

export const getPackageItemRegistry = async (suiClient: SuiClient, packageName: PackagesEnum, itemRegistryType: string): Promise<DynItem> => {
    const callerRegistryObjId = await getPackageRegistryObjectId(suiClient, packageName);

    let packageId = getPackageId(packageName);
    
    const itemRegistryDynamicFieldObj = await suiClient.getDynamicFieldObject({
        parentId: callerRegistryObjId,
        name: {
            type: `${PIR_PACKAGE_ID_ORIGINAL}::registry::RegistryKey<${packageId}::${itemRegistryType}>`,
            value: { dummy_field: false },
        },
    });

    console.log(`[PIR] getPackageItemRegistry ${packageName} ${itemRegistryType}`, itemRegistryDynamicFieldObj);

    if(!itemRegistryDynamicFieldObj){
        throw new Error(`Item registry dynamic field object not found for package: ${packageName} and  itemRegistryType: ${itemRegistryType}`);
    }

    //@ts-ignore
    const itemRegistryObjId = itemRegistryDynamicFieldObj.data?.content?.fields?.value?.fields?.id?.id;

    return {
        id: itemRegistryObjId,
        //@ts-ignore
        value: itemRegistryDynamicFieldObj.data?.content?.fields?.value,
    };
}

export const hasItemRegistryDataWithKey = async (suiClient: SuiClient, itemRegistryId: string, keyType: string, keyValue: any): Promise<boolean> => {
    console.log("🔍 [PIR] hasItemRegistryDataWithKey itemRegistryId, keyType, keyValue:", itemRegistryId, keyType, keyValue);
    const itemDataDynamicFieldObj = await suiClient.getDynamicFieldObject({
        parentId: itemRegistryId,
        name: {
            type: keyType,
            value: keyValue,
        },
    });
    
    // Check for error
    if (!itemDataDynamicFieldObj || itemDataDynamicFieldObj.error?.code === "dynamicFieldNotFound") {
        // Data is available
        return false;
    } else if (itemDataDynamicFieldObj.error) {
        // Some other error occurred
        console.error(" [PIR]: Unexpected error from Sui API:", itemDataDynamicFieldObj.error);
        // Handle as you wish, e.g.:
        throw new Error("[PIR]: Failed to check data availability: ");
    } else {
        // Data exists
        return true;
    }
}

export const getItemRegistryDataWithKey = async (suiClient: SuiClient, itemRegistryId: string, keyType: string, keyValue: any): Promise<DynItem | null> => {
    const itemDataDynamicFieldObj = await suiClient.getDynamicFieldObject({
        parentId: itemRegistryId,
        name: {
            type: keyType,
            value: keyValue,
        },
    });
    
    // Check for error
    if (!itemDataDynamicFieldObj || itemDataDynamicFieldObj.error?.code === "dynamicFieldNotFound") {
        // Data is available
        return null;
    } else if (itemDataDynamicFieldObj.error) {
        // Some other error occurred
        console.error(" [PIR]: Unexpected error from Sui API:", itemDataDynamicFieldObj.error);
        // Handle as you wish, e.g.:
        throw new Error("Failed to check data availability: ");
    } else {
        // Data exists
        // console.log("[PIR] getItemRegistryDataWithKey itemDataDynamicFieldObj:", itemDataDynamicFieldObj);

        //@ts-ignore
        const itemId = itemDataDynamicFieldObj.data?.content?.fields?.id?.id;

        //@ts-ignore
        const itemValue = itemDataDynamicFieldObj.data?.content?.fields?.value;

        return {
            id: itemId,
            value: itemValue,
        }
    }
}


// ** this is convinient when we want to check if there ise key: value pair in NameRegistry or AddressRegistry
// ** maybe we should come up with better naming but this is convinient for now
export const hasItemRegistryDataWithStringKey = async (suiClient: SuiClient, itemRegistryId: string, value: string): Promise<boolean> => {
    return hasItemRegistryDataWithKey(suiClient, itemRegistryId, `0x1::string::String`, value);
}

export const hasItemRegistryDataWithAddressKey = async (suiClient: SuiClient, itemRegistryId: string, value: string): Promise<boolean> => {
    return hasItemRegistryDataWithKey(suiClient, itemRegistryId, `address`, value);
}

export const getItemRegistryDataWithStringKey = async (suiClient: SuiClient, itemRegistryId: string, value: string): Promise<any> => {
    return getItemRegistryDataWithKey(suiClient, itemRegistryId, `0x1::string::String`, value);
}

export const getItemRegistryDataWithAddressKey = async (suiClient: SuiClient, itemRegistryId: string, value: string): Promise<any> => {
    return getItemRegistryDataWithKey(suiClient, itemRegistryId, `address`, value);
}
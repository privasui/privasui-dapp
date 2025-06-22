import { SuiClient } from '@mysten/sui/client';

export const SUI_COIN_TYPE = '0x2::sui::SUI';

export const fetchAddressBalance = async (suiClient: SuiClient, address: string): Promise<number> => {
    const balance = await suiClient.getBalance({
      owner: address,
      coinType: SUI_COIN_TYPE,
    });
    return parseInt(balance.totalBalance);
  }
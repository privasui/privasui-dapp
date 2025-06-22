// src/widgets/account/model/use-balance.ts
import { useQuery } from '@tanstack/react-query';
import { SuiClient, CoinBalance } from '@mysten/sui/client';
import { useSuiClient } from '@mysten/dapp-kit';

interface CoinInfo {
  name: string;
  balance: number;
  coinType: string;
}

// Known coin types on Sui with their metadata
const SUPPORTED_COINS = {
  SUI: {
    name: "SUI",
    coinType: "0x2::sui::SUI",
    decimals: 9
  },
  WAL: {
    name: "WAL",
    coinType: "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a65e485103a::coin::WAL",
    decimals: 9
  },
  USDC: {
    name: "USDC",
    coinType: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::USDC",
    decimals: 6
  },
  USDT: {
    name: "USDT",
    coinType: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::USDT",
    decimals: 6
  }
  // DEEP: {
  //   name: "DEEP",
  //   coinType: "0xd2013e206f7983f06132d5b61f7c577638ff63171221f4f600a98863d1f9fb1b::deep::DEEP",
  //   decimals: 9
  // },
  // CETUS: {
  //   name: "CETUS",
  //   coinType: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  //   decimals: 9
  // },
  // BUCK: {
  //   name: "BUCK",
  //   coinType: "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
  //   decimals: 9
  // }
};

const fetchCoinBalancesForAddress = async (client: SuiClient, address: string): Promise<CoinInfo[]> => {
  try {
    // Get all balances from the blockchain
    const balances: CoinBalance[] = await client.getAllBalances({ owner: address });
    
    // Create a map of coinType to balance
    const balanceMap = new Map<string, bigint>();
    balances.forEach(coin => {
      balanceMap.set(coin.coinType, BigInt(coin.totalBalance));
    });

    // Create the result array with all supported coins
    const result: CoinInfo[] = Object.values(SUPPORTED_COINS).map(coinInfo => {
      const balance = balanceMap.get(coinInfo.coinType) || BigInt(0);
      const formattedBalance = Number(balance) / 10 ** coinInfo.decimals;

      return {
        name: coinInfo.name,
        balance: Number(formattedBalance.toFixed(4)),
        coinType: coinInfo.coinType
      };
    });

    // Sort balances - put SUI first, then WAL, then stablecoins
    return result.sort((a, b) => {
      if (a.name === 'SUI') return -1;
      if (b.name === 'SUI') return 1;
      if (a.name === 'WAL') return -1;
      if (b.name === 'WAL') return 1;
      if (a.name === 'USDC' || a.name === 'USDT') return -1;
      if (b.name === 'USDC' || b.name === 'USDT') return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching coin balances:', error);
    // On error, return all supported coins with zero balance
    return Object.values(SUPPORTED_COINS).map(coinInfo => ({
      name: coinInfo.name,
      balance: 0,
      coinType: coinInfo.coinType
    }));
  }
};

export const useAccountBalance = (address: string | undefined) => {
  const suiClient = useSuiClient();

  const { data: coins = [], isLoading } = useQuery({
    queryKey: ['account-coin-balances', address],
    queryFn: async () => {
      if (!address) {
        // If no address, return all supported coins with zero balance
        return Object.values(SUPPORTED_COINS).map(coinInfo => ({
          name: coinInfo.name,
          balance: 0,
          coinType: coinInfo.coinType
        }));
      }
      return await fetchCoinBalancesForAddress(suiClient as unknown as SuiClient, address);
    },
    enabled: true, // Always enabled to show zero balances
  });

  return { coins, loading: isLoading };
};

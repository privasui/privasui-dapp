import { useQuery } from '@tanstack/react-query';

interface CoinPrice {
  usd: number;
  usd_24h_change: number;
  image: string;
}

interface CryptoPrices {
  [key: string]: CoinPrice;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const fetchCryptoPrices = async (coins: string[]): Promise<CryptoPrices> => {
  try {
    console.log('Fetching prices for coins:', coins);
    
    // First get the coin data including images
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${coins.join(',')}&order=market_cap_desc&sparkline=false`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API error:', response.status, errorText);
      throw new Error(`Failed to fetch prices: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw CoinGecko response:', data);
    
    // Transform the data into our format
    const prices: CryptoPrices = {};
    data.forEach((coin: any) => {
      prices[coin.id] = {
        usd: coin.current_price || 0,
        usd_24h_change: coin.price_change_percentage_24h || 0,
        image: coin.image || ''
      };
    });
    
    console.log('Processed prices:', prices);
    return prices;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {};
  }
};

// Define coin IDs mapping with fallback images
const COINGECKO_IDS = {
  SUI: 'sui',
  USDC: 'usd-coin',
  USDT: 'tether',
  WAL: 'walrus-2',
  CETUS: 'cetus-protocol'   // Updated ID
};

export const useCryptoPrices = () => {
  return useQuery({
    queryKey: ['crypto-prices'],
    queryFn: () => fetchCryptoPrices(Object.values(COINGECKO_IDS)),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3 // Retry failed requests up to 3 times
  });
}; 
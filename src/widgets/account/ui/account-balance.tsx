// src/widgets/account/ui/account-balance.tsx

import React from 'react';
import { useAccountBalance } from '../model/use-balance';
import { useCryptoPrices } from '../model/use-crypto-prices';

interface CoinBalanceItemProps {
  name: string;
  balance: number;
}

// Coin ID mapping for CoinGecko
const COIN_IDS = {
  SUI: 'sui',
  USDC: 'usd-coin',
  USDT: 'tether',
  WAL: 'walrus-2',
  CETUS: 'cetus-protocol'
};

const SkeletonLoader = () => (
  <div className="animate-pulse flex items-center justify-between p-4 bg-muted">
    <div className="flex flex-row gap-3 items-center">
      <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
      <div className="flex flex-col gap-2">
        <div className="h-6 w-16 bg-primary/20 rounded"></div>
        <div className="h-4 w-24 bg-primary/20 rounded"></div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="h-6 w-24 bg-primary/20 rounded"></div>
      <div className="h-4 w-20 bg-primary/20 rounded"></div>
    </div>
  </div>
);

const CoinIcon = ({ image, name }: { image?: string; name: string }) => {
  const [isImageLoading, setIsImageLoading] = React.useState(true);

  return (
    <div className="w-8 h-8 relative flex items-center justify-center">
      {image && (
        <img
          src={image}
          alt={`${name} icon`}
          className={`w-full h-full object-contain rounded-full transition-opacity duration-200 ${
            isImageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsImageLoading(false)}
          onError={() => setIsImageLoading(false)}
        />
      )}
      {(!image || isImageLoading) && (
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
      )}
    </div>
  );
};

export const CoinBalanceItem: React.FC<CoinBalanceItemProps> = ({ name, balance }) => {
  const { data: prices, isLoading: isPricesLoading } = useCryptoPrices();
  
  // Determine color based on coin name
  const getCoinColor = (coinName: string) => {
    switch (coinName.toUpperCase()) {
      case 'SUI':
        return '#6fbcf0'; // Sui blue
      case 'USDC':
        return '#2775CA'; // USDC blue
      case 'USDT':
        return '#26A17B'; // Tether green
      case 'WAL':
        return '#ff00ff'; // Walrus pink
      case 'CETUS':
        return '#f7931a'; // Cetus orange
      default:
        return '#7F7F7F'; // Default gray
    }
  };

  const coinColor = getCoinColor(name);
  const coinId = COIN_IDS[name.toUpperCase() as keyof typeof COIN_IDS];
  const coinData = coinId ? prices?.[coinId] : null;
  const coinPrice = coinData?.usd || 0;
  const priceChange24h = coinData?.usd_24h_change || 0;
  const totalValueUSD = balance * coinPrice;

  if (isPricesLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div
      className="w-full flex items-center justify-between p-4 bg-muted"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="flex flex-row gap-3 items-center">
        {/* Coin Icon */}
        <CoinIcon image={coinData?.image} name={name} />
        
        {/* Coin Name and Price Info */}
        <div className="flex flex-col">
          <span className="text-lg font-bold" style={{ color: coinColor }}>{name}</span>
          {coinData && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-300">
                ${coinPrice.toFixed(2)}
              </span>
              <span style={{ 
                color: priceChange24h >= 0 ? '#00ff00' : '#ff4444',
                fontSize: '0.75rem' 
              }}>
                {priceChange24h >= 0 ? '↑' : '↓'} 
                {Math.abs(priceChange24h).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Balance and Value */}
      <div className="flex flex-col items-end">
        <span className="text-lg font-bold" style={{ color: coinColor }}>
          {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </span>
        {coinData && totalValueUSD > 0 && (
          <span className="text-sm text-gray-400">
            ≈ ${totalValueUSD.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

interface AccountBalanceProps {
  address: string;
}

export const AccountBalance: React.FC<AccountBalanceProps> = ({ address }) => {
  const { coins, loading } = useAccountBalance(address);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-8 text-primary font-mono">
        Loading...
      </div>
    );
  }

  if (coins.length === 0) {
    return (
      <div className="w-full py-8 text-center text-gray-400 font-mono">
        No coins found
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="w-full flex flex-col rounded-2xl overflow-hidden">
        {coins.map((coin, _index) => (
          <div key={coin.name} className="border-b border-primary/15 last:border-b-0">
            <CoinBalanceItem name={coin.name} balance={coin.balance} />
          </div>
        ))}
      </div>
    </div>
  );
};
import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

type ConfigKey = 
  | 'PI_OBJECT_ID'
  | 'PIR_PACKAGE_ID_ORIGINAL'
  | 'PIR_PACKAGE_ID_LATEST'
  | 'PINS_PACKAGE_ID_ORIGINAL'
  | 'PINS_PACKAGE_ID_LATEST'
  | 'PIM_PACKAGE_ID_ORIGINAL'
  | 'PIM_PACKAGE_ID_LATEST'
  | 'PIX_PACKAGE_ID_ORIGINAL'
  | 'PIX_PACKAGE_ID_LATEST'
  | 'PRIVASUI_PACKAGE_ID_ORIGINAL' 
  | 'PRIVASUI_PACKAGE_ID_LATEST';

// Get the selected network from environment variables
export const SUI_NETWORK = import.meta.env.VITE_SUI_NETWORK || 'devnet';
console.log(`Using network: ${SUI_NETWORK}`);


const configuration = {
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      PI_OBJECT_ID: import.meta.env.VITE_DEVNET_PI_OBJECT_ID || '',
      PIR_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_DEVNET_PIR_PACKAGE_ID_ORIGINAL || '',
      PIR_PACKAGE_ID_LATEST: import.meta.env.VITE_DEVNET_PIR_PACKAGE_ID_LATEST || '',
     

      PINS_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_DEVNET_PINS_PACKAGE_ID_ORIGINAL || '',
      PINS_PACKAGE_ID_LATEST: import.meta.env.VITE_DEVNET_PINS_PACKAGE_ID_LATEST || '',

      PIM_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_DEVNET_PIM_PACKAGE_ID_ORIGINAL || '',
      PIM_PACKAGE_ID_LATEST: import.meta.env.VITE_DEVNET_PIM_PACKAGE_ID_LATEST || '',

      PIX_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_DEVNET_PIX_PACKAGE_ID_ORIGINAL || '',
      PIX_PACKAGE_ID_LATEST: import.meta.env.VITE_DEVNET_PIX_PACKAGE_ID_LATEST || '',

      PRIVASUI_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_DEVNET_PRIVASUI_PACKAGE_ID_ORIGINAL || '',
      PRIVASUI_PACKAGE_ID_LATEST: import.meta.env.VITE_DEVNET_PRIVASUI_PACKAGE_ID_LATEST || '',
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      PI_OBJECT_ID: import.meta.env.VITE_TESTNET_PI_OBJECT_ID || '',
      PIR_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_TESTNET_PIR_PACKAGE_ID_ORIGINAL || '',
      PIR_PACKAGE_ID_LATEST: import.meta.env.VITE_TESTNET_PIR_PACKAGE_ID_LATEST || '',
     

      PINS_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_TESTNET_PINS_PACKAGE_ID_ORIGINAL || '',
      PINS_PACKAGE_ID_LATEST: import.meta.env.VITE_TESTNET_PINS_PACKAGE_ID_LATEST || '',

      PIM_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_TESTNET_PIM_PACKAGE_ID_ORIGINAL || '',
      PIM_PACKAGE_ID_LATEST: import.meta.env.VITE_TESTNET_PIM_PACKAGE_ID_LATEST || '',

      PIX_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_TESTNET_PIX_PACKAGE_ID_ORIGINAL || '',
      PIX_PACKAGE_ID_LATEST: import.meta.env.VITE_TESTNET_PIX_PACKAGE_ID_LATEST || '',

      PRIVASUI_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_TESTNET_PRIVASUI_PACKAGE_ID_ORIGINAL || '',
      PRIVASUI_PACKAGE_ID_LATEST: import.meta.env.VITE_TESTNET_PRIVASUI_PACKAGE_ID_LATEST || '',
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      PI_OBJECT_ID: import.meta.env.VITE_MAINNET_PI_OBJECT_ID || '',
      PIR_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_MAINNET_PIR_PACKAGE_ID_ORIGINAL || '',
      PIR_PACKAGE_ID_LATEST: import.meta.env.VITE_MAINNET_PIR_PACKAGE_ID_LATEST || '',
     

      PINS_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_MAINNET_PINS_PACKAGE_ID_ORIGINAL || '',
      PINS_PACKAGE_ID_LATEST: import.meta.env.VITE_MAINNET_PINS_PACKAGE_ID_LATEST || '',

      PIM_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_MAINNET_PIM_PACKAGE_ID_ORIGINAL || '',
      PIM_PACKAGE_ID_LATEST: import.meta.env.VITE_MAINNET_PIM_PACKAGE_ID_LATEST || '',

      PIX_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_MAINNET_PIX_PACKAGE_ID_ORIGINAL || '',
      PIX_PACKAGE_ID_LATEST: import.meta.env.VITE_MAINNET_PIX_PACKAGE_ID_LATEST || '',

      PRIVASUI_PACKAGE_ID_ORIGINAL: import.meta.env.VITE_MAINNET_PRIVASUI_PACKAGE_ID_ORIGINAL || '',
      PRIVASUI_PACKAGE_ID_LATEST: import.meta.env.VITE_MAINNET_PRIVASUI_PACKAGE_ID_LATEST || '',
    },
  },
};

export const getNetworkVariable = (configKey: ConfigKey): string => {
  const network = SUI_NETWORK as NetworkType;
  if (!configuration[network]) {
    throw new Error(`Network configuration for ${network} not found`);
  }
  return configuration[network].variables[configKey];
}

// Create network configuration with explicit variables for each network
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig(configuration);

// Helper functions to check current network
export const isDevnet = () => SUI_NETWORK === 'devnet';
export const isTestnet = () => SUI_NETWORK === 'testnet';
export const isMainnet = () => SUI_NETWORK === 'mainnet';

// Network URL based on selected network
export const NETWORK_URL = isDevnet() 
  ? 'https://fullnode.devnet.sui.io' 
  : isTestnet() 
    ? 'https://fullnode.testnet.sui.io' 
    : 'https://fullnode.mainnet.sui.io';

export { useNetworkVariable, useNetworkVariables, networkConfig };


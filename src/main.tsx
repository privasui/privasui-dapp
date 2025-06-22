import ReactDOM from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "@mysten/dapp-kit/dist/index.css";
import "./styles.main.css";
import { AppRoutes } from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider } from "@mysten/dapp-kit";
import { networkConfig } from "./shared/network-config";

export const queryClient = new QueryClient();

console.log("🔍 [main]");

ReactDOM.createRoot(document.getElementById("root")!).render(
  // If you want to disable double mounting in development, remove StrictMode
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork={import.meta.env.VITE_SUI_NETWORK as "devnet" | "mainnet" | "testnet"}>
      {/* <WalletProvider autoConnect={true}> */}
       <AppRoutes />
      {/* </WalletProvider> */}
    </SuiClientProvider>
  </QueryClientProvider>,
);

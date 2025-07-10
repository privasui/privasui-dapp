import { queryClient } from "@/main";
import { createBuyPiNameTx } from "@/shared/suipi/tx";
import { invalidatePiNameCache } from "@/shared/suipi/pins";
import { useMutation } from "@tanstack/react-query";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Account, useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";

// Buy PINS name from current owner
const buyPiName = async (
  account: Account | undefined,
  name: string,
  price: number,
  client: SuiClient,
) => {
  if(!account || !account.privateKey) {
    throw new Error("No account found");
  }

  const keypair = await Ed25519Keypair.fromSecretKey(account?.privateKey);

  // Create transaction using helper
  const tx = await createBuyPiNameTx(
    client,
    name,
    price,
  );

  tx.setSender(account.publicKey);

  // Sign + Execute
  const { bytes, signature } = await tx.sign({
    signer: keypair,
    client,
  });

  const txResult = await client.executeTransactionBlock({
    transactionBlock: bytes,
    signature,
  });

  const status = await client.waitForTransaction({
    digest: txResult.digest,
    timeout: 30000 // 30 seconds timeout
  });

  if (!status) {
    throw new Error("Transaction failed to confirm");
  }

  const txStatus = await client.getTransactionBlock({
    digest: txResult.digest,
    options: {
      showEffects: true,
      showInput: true,
    },
  });

  if (txStatus.effects?.status.status != "success") {
    throw new Error(`Transaction failed: ${txStatus.effects?.status.error || "Unknown error"}`);
  } 

  return txResult;
};

export const useNamePurchase = () => {
  const client = useSuiClient();  
  const { activeAccount } = useWalletAccountStore();
  
  return useMutation({
    mutationFn: async ({
      name,
      price,
      onComplete,
      onError,
    }: {
      name: string;
      price: number;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }) => {
      try {
        console.log(`🛒 [Purchase] Starting purchase for ${name} at ${price} SUI`);
        
        const result = await buyPiName(
          activeAccount,
          name,
          price,
          client as unknown as SuiClient,
        );
        
        console.log(`✅ [Purchase] Transaction successful for ${name}, digest: ${result.digest}`);
        
        // Invalidate PiNS cache for the purchased name AND clear all cache to ensure fresh data
        invalidatePiNameCache(name);
        invalidatePiNameCache(); // Clear all cache
        console.log(`🔄 [Purchase] Invalidated cache for ${name} and cleared all cache`);
        
        // After successful name purchase, refetch related data
        await queryClient.refetchQueries({
          queryKey: ['pins-names'],
        });
        
        // Also invalidate other relevant queries
        await queryClient.invalidateQueries({ queryKey: ['pins'] });
        await queryClient.invalidateQueries({ queryKey: ['ownedObjects'] });
        
        console.log(`🔄 [Purchase] Query cache invalidated`);
        
        if (onComplete) {
          await onComplete();
        }
        return result;
      } catch (error) {
        console.error(`❌ [Purchase] Error purchasing name ${name}:`, error);
        // Properly propagate the error so React Query can handle it
        if (onError && error instanceof Error) {
          onError(error);
        }
        throw error;
      }
    },
  });
}; 
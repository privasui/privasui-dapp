import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Account, useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSetPiNameSalePriceTx, createUnsetPiNameSalePriceTx } from "@/shared/suipi/tx";
import { invalidatePiNameCache } from "@/shared/suipi/pins";

// Helper function to execute a transaction
// TODO - share helper function ... move to other place ...
const executeTransaction = async (
  tx: any,
  account: Account,
  client: ReturnType<typeof useSuiClient>
) => {
  if (!account.privateKey) {
    throw new Error("No private key found");
  }

  const keypair = await Ed25519Keypair.fromSecretKey(account.privateKey);

  // Sign transaction
  const { bytes, signature } = await tx.sign({
    client,
    signer: keypair,
  });

  // Execute transaction
  const result = await client.executeTransactionBlock({
    transactionBlock: bytes,
    signature,
  });

  // Wait for transaction to confirm
  const status = await client.waitForTransaction({
    digest: result.digest,
    timeout: 30000 // 30 seconds timeout
  });

  if (!status) {
    throw new Error("Transaction failed to confirm");
  }

  // Get transaction details
  const txStatus = await client.getTransactionBlock({
    digest: result.digest,
    options: {
      showEffects: true,
      showInput: true,
    },
  });

  if (txStatus.effects?.status.status !== "success") {
    throw new Error(`Transaction failed: ${txStatus.effects?.status.error || "Unknown error"}`);
  }

  return result;
};

export const usePiNamePriceManagement = () => {
  const { activeAccount } = useWalletAccountStore();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  // Mutation for setting price
  const setPrice = useMutation({
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
        const tx = await createSetPiNameSalePriceTx(suiClient as any, name, price);
        if (!activeAccount?.publicKey) {
          throw new Error("No active account");
        }
        tx.setSender(activeAccount.publicKey);
        
        const result = await executeTransaction(tx, activeAccount, suiClient);
        console.log("✅ [PiNS] Price set successfully");
        
        // Invalidate the specific name cache
        invalidatePiNameCache(name);
        
        // Invalidate all queries that might have cached the old price
        await queryClient.invalidateQueries({ queryKey: ['pins'] });
        await queryClient.invalidateQueries({ queryKey: ['ownedObjects'] });
        
        if (onComplete) {
          await onComplete();
        }
        
        return result;
      } catch (error: any) {
        console.error("❌ [PiNS] Failed to set price:", error);
        if (onError) {
          onError(error);
        }
        throw error;
      }
    },
  });

  // Mutation for unsetting price
  const unsetPrice = useMutation({
    mutationFn: async ({
      name,
      onComplete,
      onError,
    }: {
      name: string;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }) => {
      try {
        const tx = await createUnsetPiNameSalePriceTx(suiClient as any, name);
        if (!activeAccount?.publicKey) {
          throw new Error("No active account");
        }
        tx.setSender(activeAccount.publicKey);
        
        const result = await executeTransaction(tx, activeAccount, suiClient);
        console.log("✅ [PiNS] Price removed successfully");
        
        // Invalidate the specific name cache
        invalidatePiNameCache(name);
        
        // Invalidate all queries that might have cached the old price
        await queryClient.invalidateQueries({ queryKey: ['pins'] });
        await queryClient.invalidateQueries({ queryKey: ['ownedObjects'] });
        
        if (onComplete) {
          await onComplete();
        }
        
        return result;
      } catch (error: any) {
        console.error("❌ [PiNS] Failed to remove price:", error);
        if (onError) {
          onError(error);
        }
        throw error;
      }
    },
  });

  return {
    setPrice,
    unsetPrice,
  };
}; 
import { useMutation } from "@tanstack/react-query";
import { useWalletAccountStore, Account } from "@/widgets/profile/model/use-wallet-accounts";
import { createNftTransferTx, createPiNSTransferTx } from "@/shared/suipi";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { useSuiClient } from "@mysten/dapp-kit";
import { queryClient } from "@/main";

interface NftTransferParams {
  recipient: string;
  objectId: string;
  isPiNS?: boolean;
  onComplete?: () => Promise<void>;
  onError?: (error: any) => Promise<void>;
}

// Transfer NFT to recipient
const transferNft = async (
  account: Account | undefined,
  recipient: string,
  objectId: string,
  client: SuiClient,
  isPiNS: boolean = false,
) => {
  if(!account || !account.privateKey) {
    throw new Error("No account found");
  }

  const keypair = await Ed25519Keypair.fromSecretKey(account?.privateKey);

  // Create transaction using appropriate helper
  // PiNS NFTs need custom transfer function, regular NFTs use standard transfer
  const tx = isPiNS 
    ? await createPiNSTransferTx(client, recipient, objectId)
    : createNftTransferTx(recipient, objectId);

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

export const useNftTransfer = () => {
  const client = useSuiClient();
  const { activeAccount } = useWalletAccountStore();

  return useMutation({
    mutationFn: async ({ recipient, objectId, isPiNS = false, onComplete, onError }: NftTransferParams) => {
      try {
        const result = await transferNft(
          activeAccount,
          recipient,
          objectId,
          client as unknown as SuiClient,
          isPiNS,
        );

        console.log("🟢 piNS NFT transfer completed successfully:", result.digest);
        
        // After successful NFT transfer, refetch related data
        await queryClient.refetchQueries({
          queryKey: ['pins-nfts'],
        });
        
        if (onComplete) {
          await onComplete();
        }

        return result;
      } catch (error) {
        console.error("🔴 piNS NFT transfer failed:", error);
        if (onError) {
          await onError(error);
        }
        throw error;
      }
    },
  });
}; 
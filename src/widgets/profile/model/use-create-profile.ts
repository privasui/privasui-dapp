import { queryClient } from "@/main";
import { createProfileTx } from "@/shared/suipi";
import { useMutation } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "./use-profile";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { convertRawEd25519ToX25519 } from "@/shared/cryptography";
import { Account, useWalletAccountStore } from "./use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";

// Create profile
const createProfile = async (
  account: Account | undefined,
  name: string,
  avatarSvg: string,
  lifetime: boolean,
  price: number,
  client: SuiClient,
) => {
  if(!account || !account.privateKey) {
    throw new Error("No account found");
  }

  // Convert avatar SVG to bytes
  const avatarBytes = new TextEncoder().encode(avatarSvg);

  const keypair = await Ed25519Keypair.fromSecretKey(account?.privateKey);
  const { xPublicKey } = await convertRawEd25519ToX25519(keypair);

  // Create transaction using pure helper
  const tx = await createProfileTx(
    client,
    xPublicKey,
    name,
    avatarBytes,
    lifetime,
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

export const useCreateProfile = () => {
  const client = useSuiClient();  
  const { activeAccount } = useWalletAccountStore();
  
  const mutation = useMutation({
    mutationFn: async ({
      name,
      avatarSvg,
      lifetime,
      price,
      onComplete,
      onError,
    }: {
      name: string;
      avatarSvg: string;
      lifetime: boolean;
      price: number;
      onComplete: () => void;
      onError?: (error: Error) => void;
    }) => {
      try {
        const result = await createProfile(
          activeAccount,
          name,
          avatarSvg,
          lifetime,
          price,
          client as unknown as SuiClient,
        );
        
        // After successful profile creation, refetch profile data
        await queryClient.refetchQueries({
          queryKey: [PROFILE_QUERY_KEY],
        });
        
        onComplete();
        return result;
      } catch (error) {
        console.error("[useProfile] Error creating profile:", error);
        // Properly propagate the error so React Query can handle it
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
  });

  return mutation;
};

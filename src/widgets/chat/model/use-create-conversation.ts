
import { EncryptedMessage } from "@/shared/cryptography";
import { createConversationTx } from "@/shared/suipi";
import { Account, useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { useMutation } from "@tanstack/react-query";


// Create profile
export const createConversation = async (
  account: Account | undefined,
  recipient: string,
  encryptedMessage: EncryptedMessage,
  onComplete: () => void,
  onError: (error: Error) => void,
  client: SuiClient,
) => {
  try {
    
    if(!account || !account.privateKey) {
      throw new Error("No account found");
    }

    // Create transaction using pure helper
    const tx = await createConversationTx(
      client,
      recipient,
      encryptedMessage,
    );

    tx.setSender(account.publicKey);

    const keypair = await Ed25519Keypair.fromSecretKey(account?.privateKey);

    const { bytes, signature } = await tx.sign({
      signer: keypair,
      client,
    });

    const txResult = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
    });

    console.log("🔍 [useCreateConversation] Conversation created:", txResult);
    onComplete();
  } catch (error) {
    onError(error as Error);
    console.error("[useCreateConversation] Error creating conversation:", error);
  }
};

export const useCreateConversation = () => {
  const { activeAccount } = useWalletAccountStore();
  const client = useSuiClient();

  const mutation = useMutation({
    mutationFn: async ({
        recipient,
        encryptedMessage,
        onComplete,
        onError,
    }: {
        recipient: string;
        encryptedMessage: EncryptedMessage;
        onComplete: () => void;
        onError: (error: Error) => void;
    }) => {
        
      await createConversation(
        activeAccount,
        recipient,
        encryptedMessage,
        onComplete,
        onError,
        client as unknown as SuiClient,
      );
    },
  });

  return mutation;
};

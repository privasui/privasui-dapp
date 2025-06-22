
import { EncryptedMessage } from "@/shared/cryptography";
import { fetchConversationOwnerStreamId, sendMessageTx } from "@/shared/suipi";
import { Account, useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { useMutation } from "@tanstack/react-query";

// Create profile
export const sendMessage = async (
  account: Account | undefined,
  streamId: string,
  encryptedMessage: EncryptedMessage,
  onComplete: () => Promise<void>,
  onError: (error: Error) => Promise<void>,
  client: SuiClient,
) => {
  try {

    if(!account || !account.privateKey) {
      throw new Error("No account found");
    }

    // send transaction using pure helper
    const tx = await sendMessageTx(
      client,
      streamId,
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

    // TODO: here I want to wait for the transaction to be processed
    // here I want to wait for the transaction to be processed
    // await client.waitForTransaction({
    //   digest: txResult.digest,
    // });

    console.log("🔍 [useSendMessage] Message sent:", txResult);
    await onComplete();

  } catch (error) {
    console.error("[useSendMessage] Error sending message:", error);
    await onError(error as Error);
  }
};

export const useSendMessage = () => {
  const suiClient = useSuiClient();
  const { activeAccount } = useWalletAccountStore();

  const mutation = useMutation({
    mutationFn: async ({
        recipient,
        encryptedMessage,
        onComplete,
        onError,
    }: {
        recipient: string;
        encryptedMessage: EncryptedMessage;
        onComplete: () => Promise<void>;
        onError: (error: Error) => Promise<void>;
    }) => {


      const streamId = await fetchConversationOwnerStreamId(
        suiClient as unknown as SuiClient,
        activeAccount?.publicKey as string,
        recipient,
      );

      if(!streamId){
        throw new Error("Stream not found");
      }
        
      await sendMessage(
        activeAccount,
        streamId,
        encryptedMessage,
        onComplete,
        onError,
        suiClient as unknown as SuiClient,
      );
    },
  });

  return mutation;
};

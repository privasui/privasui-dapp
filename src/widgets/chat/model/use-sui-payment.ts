import { sendSuiPaymentTx } from "@/shared/suipi";
import { Account, useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { useMutation } from "@tanstack/react-query";


const sendSuiPayment = async (
  account: Account | undefined,
  recipient: string,
  mistAmount: BigInt,
  onComplete: () => Promise<void>,
  onError: (error: Error) => Promise<void>,
  client: SuiClient,
) => {
  try {
    if(!account || !account.privateKey) {
      throw new Error("No account found");
    }

    const tx = sendSuiPaymentTx(
      recipient,
      mistAmount,
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

    console.log("🔍 [useSuiPayment] Transaction sent:", txResult);

    // Wait for transaction confirmation
    try {
      const status = await client.waitForTransaction({
        digest: txResult.digest,
        timeout: 30000 // 30 seconds timeout
      });

      if (!status) {
        throw new Error("Transaction failed to confirm");
      }

      // Get transaction status
      const txStatus = await client.getTransactionBlock({
        digest: txResult.digest,
        options: {
          showEffects: true,
          showInput: true,
        },
      });

      if (txStatus.effects?.status.status === "success") {
        console.log("🔍 [useSuiPayment] Transaction confirmed:", txStatus);
        await onComplete();
      } else {
        throw new Error(`Transaction failed: ${txStatus.effects?.status.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("[useSuiPayment] Transaction confirmation failed:", error);
      throw new Error("Transaction failed to confirm. Please check your wallet for status.");
    }

  } catch (error) {
    console.error("[useSuiPayment] Error sending payment:", error);
    await onError(error as Error);
  }
};

export const useSuiPayment = () => {
  const suiClient = useSuiClient();
  const { activeAccount } = useWalletAccountStore();

  const mutation = useMutation({
    mutationFn: async ({
        recipient,
        mistAmount,
        onComplete,
        onError,
    }: {
        recipient: string;
        mistAmount: BigInt;
        onComplete: () => Promise<void>;
        onError: (error: Error) => Promise<void>;
    }) => {
        
      await sendSuiPayment(
        activeAccount,
        recipient,
        mistAmount,
        onComplete,
        onError,
        suiClient as unknown as SuiClient,
      );
    },
  });

  return mutation;
};

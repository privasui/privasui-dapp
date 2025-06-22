import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { ConversationMetadata } from "@/shared/types";
import { convertRawEd25519ToX25519, generateSharedKey, toHex } from "@/shared/cryptography";
import { Account, useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSharedKeyStore } from "@/widgets/profile/model/use-shared-key";
import {fetchConversationOwnerStreamId, fetchPiMProfileByAddress, fetchStreamById, PimProfileInterface} from "@/shared/suipi";

// Fetch conversation metadata
export const fetchConversationMeta = async (
  currentAccount: Account | undefined,
  recipientAccountAddress: string,
  suiClient: SuiClient,
  _sharedKey: string,
  setSharedKey: (sharedKey: string) => void,
): Promise<ConversationMetadata | null> => {
  try {
    if(!currentAccount){
      return null;
    }

    console.log(`🔍 [fetchConversationMeta] Fetching chain data for ${recipientAccountAddress.substring(0, 8)}...`);

    let recipientPimProfile: PimProfileInterface | null = await fetchPiMProfileByAddress(suiClient as any, recipientAccountAddress);

    if(!recipientPimProfile) {
      // TODO: handle this 
      return null;
    }

    const keypair = Ed25519Keypair.fromSecretKey(currentAccount.privateKey);
    const { xPrivateKey } = await convertRawEd25519ToX25519(keypair);

    console.log("🔍 iiiii [fetchConversationMeta] recipientPimProfile:", recipientPimProfile);

    const conversationSharedKey = await generateSharedKey(xPrivateKey, new Uint8Array(recipientPimProfile.xpubkey));
    setSharedKey(toHex(conversationSharedKey));

    const ownerStreamId = await fetchConversationOwnerStreamId(
      suiClient as unknown as SuiClient,
      currentAccount.publicKey,
      recipientAccountAddress,
    );

    if(!ownerStreamId){
      return { exists: false };
    }

    const ownerStream = await fetchStreamById(suiClient as unknown as SuiClient, ownerStreamId);

    //@ts-ignore
    const pairStreamId = ownerStream.pair_stream;

    const pairStream = await fetchStreamById(suiClient as unknown as SuiClient, pairStreamId);

    if(!ownerStream || !pairStream){
      return { exists: false };
    }

    console.log(`🔍 [fetchConversationMeta] Raw chain data: ownerNextId=${ownerStream.next_id}, pairNextId=${pairStream.next_id}`);

    let result = {
      exists: true,
      ownerStreamId,
      pairStreamId,
      ownerNextId: Number(ownerStream.next_id),
      pairNextId: Number(pairStream.next_id),
    };

    console.log("🔍 [fetchConversationMeta] result:", result);

    return result;
  } catch (error: any) {
    console.error("[fetchConversationMeta] Error:", error);
    return { exists: false };
  }
};

// Export hook to query conversation metadata
export const useConversationMetadata = (recipientAddress: string) => {
  const suiClient = useSuiClient();
  const { getActiveAccount } = useWalletAccountStore();
  const { sharedKey, setSharedKey } = useSharedKeyStore();

  return useQuery({
    queryKey: ['conversation-metadata', recipientAddress],
    queryFn: async () => {
      console.log(`🔍 [useConversationMetadata] Fetching metadata for ${recipientAddress.substring(0, 8)}...`);
      
      const currentAccount = await getActiveAccount();
      if (!currentAccount) {
        console.log(`🔍 [useConversationMetadata] No active account available`);
        return { exists: false } as ConversationMetadata;
      }
      
      // Fetch basic conversation info (streams, IDs, etc)
      const metadata = await fetchConversationMeta(
        currentAccount,
        recipientAddress,
        suiClient as unknown as SuiClient,
        sharedKey,
        setSharedKey
      );
      
      console.log(`🔍 [useConversationMetadata] Fetched metadata: exists=${metadata?.exists}, ownerNextId=${metadata?.ownerNextId || 'N/A'}, pairNextId=${metadata?.pairNextId || 'N/A'}`);
      
      return metadata || { exists: false } as ConversationMetadata;
    },
     // Always treat data as stale immediately
     staleTime: 0,
     // Always refetch when component mounts
     refetchOnMount: 'always',
     // Don't cache at all
     gcTime: 0,
     // Don't use any cached data to start with
     refetchOnReconnect: 'always',
     refetchOnWindowFocus: false,
  });
};

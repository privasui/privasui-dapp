import { fetchStreams } from "@/shared/suipi";
import { MessageStream } from "@/shared/types";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { useQuery } from "@tanstack/react-query";

export const MESSAGE_STREAMS_KEY = 'message-streams';

export const useMessageStreams = () => {
    const suiClient = useSuiClient();
    const { activeAccount } = useWalletAccountStore();
  
    const result = useQuery({
      enabled: !!activeAccount?.publicKey,
      // TODO: query key for message maybe can be based on page
      queryKey: [MESSAGE_STREAMS_KEY],
      queryFn: async () => {

        const myOwnStreams: MessageStream[] = await fetchStreams(
          suiClient as unknown as SuiClient,
          activeAccount?.publicKey!,
        );

        return myOwnStreams;
      },
    });

    // here we have the streams so we can check if we have 
  
    return result;
  };
  
  
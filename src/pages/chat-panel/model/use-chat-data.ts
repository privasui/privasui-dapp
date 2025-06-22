import { useConversationMetadata } from "./use-chat-metadata";
import { useChatMessages } from "./use-chat-messages";

// 3. Combined hook for component use
export const useChatData = (recipientAddress: string) => {
  const metadataQuery = useConversationMetadata(recipientAddress);
  const messagesQuery = useChatMessages(recipientAddress);
  
  return {
    isLoading: metadataQuery.isLoading || messagesQuery.isLoading,
    isFetching: metadataQuery.isFetching || messagesQuery.isFetching,
    isLoadingOlder: messagesQuery.isLoadingOlder,
    error: metadataQuery.error || messagesQuery.error,
    data: {
      exists: metadataQuery.data?.exists || false,
      messages: messagesQuery.data?.messages || [],
      messageCount: messagesQuery.data?.messageCount || 0,
      ownerStreamId: metadataQuery.data?.ownerStreamId,
      pairStreamId: metadataQuery.data?.pairStreamId,
      ownerNextId: metadataQuery.data?.ownerNextId,
      pairNextId: metadataQuery.data?.pairNextId,
      hasMoreMessages: messagesQuery.data?.hasMoreMessages || false
    },
    refetchAll: async () => {
      await metadataQuery.refetch();
      await messagesQuery.refetch();
    },
    refetchMetadata: metadataQuery.refetch,
    refetchMessages: messagesQuery.refetch,
    checkForNewMessages: messagesQuery.checkForNewMessages,
    loadOlderMessages: messagesQuery.loadOlderMessages
  };
};

// Re-export everything for backwards compatibility
export {
  useChatMessages,
};


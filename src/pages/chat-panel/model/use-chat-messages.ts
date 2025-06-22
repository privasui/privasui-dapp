// use-chat-messages.ts
import { useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { useQuery } from "@tanstack/react-query";

import { queryClient } from "@/main";
import { Message, ConversationMetadata } from "@/shared/types";
import { fromHex, decryptMessageWithSharedKey } from "@/shared/cryptography";
import { fetchStreamById, fetchStreamMessages } from "@/shared/suipi";
import { useSharedKeyStore } from "@/widgets/profile/model/use-shared-key";

import { useConversationMetadata } from "./use-chat-metadata";
import { useConversationTracking } from "@/widgets/chat/model/use-conversation-tracking";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";

export const CHAT_DATA_KEY = "chat-data-key";
const MESSAGE_COUNT_PER_STEP = 5;

// Fetch and decrypt messages
export const fetchAndDecryptMessages = async (
  suiClient: SuiClient,
  ownerStreamId: string,
  pairStreamId: string,
  ownerNextId: number,
  pairNextId: number,
  sharedKey: string
): Promise<{
  messages: Message[],
  endingOwnerPointer: number,
  endingPairPointer: number,
  hasMoreMessages: boolean
}> => {
  try {
    // Get stream objects to access message tables
    const ownerStream = await fetchStreamById(suiClient as unknown as SuiClient, ownerStreamId);
    const pairStream = ownerStreamId === pairStreamId ? ownerStream : await fetchStreamById(suiClient as unknown as SuiClient, pairStreamId);
    
    if(!ownerStream || !pairStream){
      return { 
        messages: [], 
        endingOwnerPointer: -1, 
        endingPairPointer: -1,
        hasMoreMessages: false 
      };
    }

    console.log("🔍 [fetchAndDecryptMessages] ownerStream:", ownerStream);
    console.log("🔍 [fetchAndDecryptMessages] pairStream:", pairStream);
    
    const ownerStreamMessageTableId = ownerStream.messages.fields.id.id;
    const pairStreamMessageTableId = pairStream.messages.fields.id.id;
    
    // Initialize pointers to the most recent message in each stream
    let ownerPointer = ownerNextId - 1;  // Most recent message in owner stream
    let pairPointer = pairNextId - 1;    // Most recent message in pair stream
    
    let currentOwnerMessage: Message | null = null;
    let currentPairMessage: Message | null = null;
    
    const mergedMessages: Message[] = [];
    const targetMessageCount = MESSAGE_COUNT_PER_STEP * 2;
    
    console.log("Starting message merge with:", {
      ownerStart: ownerPointer,
      pairStart: pairPointer,
      targetCount: targetMessageCount
    });
    
    // Fetch initial messages if available
    if (ownerPointer >= 0) {
      const ownerMessages = await fetchStreamMessages(
        suiClient as unknown as SuiClient,
        ownerStreamMessageTableId,
        ownerPointer,
        ownerPointer,
      );
      
      if (ownerMessages.length > 0) {
        currentOwnerMessage = ownerMessages[0];
      } else {
        ownerPointer = -1; // No messages in owner stream
      }
    }
    
    // Only fetch from pair stream if it's different from owner stream
    if (pairPointer >= 0 && ownerStreamId !== pairStreamId) {
      const pairMessages = await fetchStreamMessages(
        suiClient as unknown as SuiClient,
        pairStreamMessageTableId,
        pairPointer,
        pairPointer,
      );
      
      if (pairMessages.length > 0) {
        currentPairMessage = pairMessages[0];
      } else {
        pairPointer = -1; // No messages in pair stream
      }
    } else {
      pairPointer = -1; // Skip pair stream if it's the same as owner stream
    }
    
    // Merge messages by timestamp until we reach the target count
    while (mergedMessages.length < targetMessageCount && (currentOwnerMessage || currentPairMessage)) {
      // Determine which message to add based on timestamp
      let messageToAdd: Message | null = null;
      
      if (currentOwnerMessage && currentPairMessage) {
        // Compare timestamps - take the more recent one
        const ownerTimestamp = Number(currentOwnerMessage.timestamp);
        const pairTimestamp = Number(currentPairMessage.timestamp);
        
        if (ownerTimestamp >= pairTimestamp) {
          messageToAdd = currentOwnerMessage;
          ownerPointer--;
          currentOwnerMessage = null; // We've consumed this message
        } else {
          messageToAdd = currentPairMessage;
          pairPointer--;
          currentPairMessage = null; // We've consumed this message
        }
      } else if (currentOwnerMessage) {
        // Only owner message available
        messageToAdd = currentOwnerMessage;
        ownerPointer--;
        currentOwnerMessage = null;
      } else if (currentPairMessage) {
        // Only pair message available
        messageToAdd = currentPairMessage;
        pairPointer--;
        currentPairMessage = null;
      }
      
      // Add the selected message to our results
      if (messageToAdd) {
        mergedMessages.push(messageToAdd);
      }
      
      // Fetch next message from owner stream if needed
      if (currentOwnerMessage === null && ownerPointer >= 0) {
        const ownerMessages = await fetchStreamMessages(
          suiClient as unknown as SuiClient,
          ownerStreamMessageTableId,
          ownerPointer,
          ownerPointer,
        );
        
        if (ownerMessages.length > 0) {
          currentOwnerMessage = ownerMessages[0];
        } else {
          ownerPointer = -1; // No more messages in owner stream
        }
      }
      
      // Fetch next message from pair stream if needed and if it's different from owner stream
      if (currentPairMessage === null && pairPointer >= 0 && ownerStreamId !== pairStreamId) {
        const pairMessages = await fetchStreamMessages(
          suiClient as unknown as SuiClient,
          pairStreamMessageTableId,
          pairPointer,
          pairPointer,
        );
        
        if (pairMessages.length > 0) {
          currentPairMessage = pairMessages[0];
        } else {
          pairPointer = -1; // No more messages in pair stream
        }
      }
    }
    
    // Determine if we have more messages to load
    const hasMoreMessages = ownerPointer >= 0 || pairPointer >= 0;
    
    console.log("Merged message results:", {
      total: mergedMessages.length,
      endingOwnerPointer: ownerPointer + 1,
      endingPairPointer: pairPointer + 1,
      hasMoreMessages
    });
    
    // Make sure all sorting across the file is consistent
    const sortedMessages = mergedMessages.sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp) // Ascending - older first, newer last
    );
    
    // Decrypt all messages
    const decryptedMessages = await Promise.all(
      sortedMessages.map(async (message: Message) => {
        try {
          const decodedMessage = await decryptMessageWithSharedKey(fromHex(sharedKey), {
            encryptedBytes: new Uint8Array(message.content),
            nonceBytes: new Uint8Array(message.nonce),
          });
          return { ...message, decoded_content: decodedMessage };
        } catch (error) {
          return { ...message, decoded_content: "" };
        }
      })
    );
    
    return { 
      messages: decryptedMessages, 
      endingOwnerPointer: ownerPointer + 1, 
      endingPairPointer: pairPointer + 1,
      hasMoreMessages
    };
  } catch (error) {
    console.error("[fetchAndDecryptMessages] Error:", error);
    return { 
      messages: [], 
      endingOwnerPointer: -1, 
      endingPairPointer: -1,
      hasMoreMessages: false 
    };
  }
};

// Fetch new messages function
export const fetchNewMessagesOnly = async (
  suiClient: SuiClient,
  ownerStreamId: string,
  pairStreamId: string,
  lastOwnerNextId: number,
  lastPairNextId: number,
  sharedKey: string,
): Promise<{ messages: Message[], newOwnerNextId: number, newPairNextId: number }> => {
  try {
    console.log(`🔍 AAAA [fetchNewMessagesOnly] Checking for new messages: lastOwnerNextId=${lastOwnerNextId}, lastPairNextId=${lastPairNextId}`);
    
    // Fetch latest stream data to get current next_id
    const [ownerStream, pairStream] = await Promise.all([
      fetchStreamById(suiClient as unknown as SuiClient, ownerStreamId),
      fetchStreamById(suiClient as unknown as SuiClient, pairStreamId),
    ]);

    console.log("🔍 AAAA [fetchNewMessagesOnly] ownerStream:", ownerStream);
    console.log("🔍 AAAA [fetchNewMessagesOnly] pairStream:", pairStream);

    // Extract next_id values
    //@ts-ignore
    const ownerNextId = Number(ownerStream.next_id);
    //@ts-ignore
    const pairNextId = Number(pairStream.next_id);
    
    console.log(`🔍 [fetchNewMessagesOnly] Current chain state: ownerNextId=${ownerNextId}, pairNextId=${pairNextId}`);
    
    // Check for new messages in either stream BEFORE fetching any message data
    const ownerHasNewMessages = ownerNextId > lastOwnerNextId;
    const pairHasNewMessages = pairNextId > lastPairNextId;
    
    console.log(`🔍 [fetchNewMessagesOnly] Message detection: ownerHasNew=${ownerHasNewMessages}, pairHasNew=${pairHasNewMessages}`);
    
    // No new messages? Return empty array immediately without fetching anything
    if (!ownerHasNewMessages && !pairHasNewMessages) {
      console.log("🔍 [fetchNewMessagesOnly] No new messages detected, skipping fetch");
      return { messages: [], newOwnerNextId: ownerNextId, newPairNextId: pairNextId };
    }
    
    // Extract message table IDs only if we need to fetch
    //@ts-ignore
    const ownerStreamMessageTableId = ownerStream.messages.fields.id.id;
    //@ts-ignore
    const pairStreamMessageTableId = pairStream.messages.fields.id.id;
    
    console.log(`🔍 [fetchNewMessagesOnly] Fetching new messages: owner stream ${lastOwnerNextId} → ${ownerNextId}, pair stream ${lastPairNextId} → ${pairNextId}`);
    
    // Only fetch the exact new messages from each stream
    const [newOwnerMessages, newPairMessages] = await Promise.all([
      ownerHasNewMessages 
        ? fetchStreamMessages(
            suiClient as unknown as SuiClient,
            ownerStreamMessageTableId,
            ownerNextId - 1, // Start from the newest
            lastOwnerNextId,  // Down to but not including the last known ID
          )
        : Promise.resolve([]),
      pairHasNewMessages && ownerStreamId !== pairStreamId
        ? fetchStreamMessages(
            suiClient as unknown as SuiClient,
            pairStreamMessageTableId,
            pairNextId - 1,  // Start from the newest
            lastPairNextId,   // Down to but not including the last known ID
          )
        : Promise.resolve([]),
    ]);
    
    console.log(`🔍 [fetchNewMessagesOnly] Raw message counts: owner=${newOwnerMessages.length}, pair=${newPairMessages.length}`);
    
    // Combine and sort new messages
    const newCombinedMessages = [...newOwnerMessages, ...newPairMessages].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );
    
    // Decrypt new messages
    const decryptedNewMessages = await Promise.all(
      newCombinedMessages.map(async (message: Message) => {
        try {
          const decodedMessage = await decryptMessageWithSharedKey(fromHex(sharedKey), {
            encryptedBytes: new Uint8Array(message.content),
            nonceBytes: new Uint8Array(message.nonce),
          });
          return { ...message, decoded_content: decodedMessage };
        } catch (error) {
          return { ...message, decoded_content: "" };
        }
      })
    );
    
    // Return new messages and updated next_id values
    return { 
      messages: decryptedNewMessages,
      newOwnerNextId: ownerNextId,
      newPairNextId: pairNextId
    };
  } catch (error) {
    console.error("[fetchNewMessagesOnly] Error:", error);
    return { messages: [], newOwnerNextId: lastOwnerNextId, newPairNextId: lastPairNextId };
  }
};

// Query hook for messages
export const useConversationMessages = (recipientAddress: string, metadata: ConversationMetadata | undefined) => {
  const suiClient = useSuiClient();
  const { sharedKey } = useSharedKeyStore();
  
  return useQuery({
    queryKey: ['conversation-messages', recipientAddress],
    queryFn: async () => {
      if (!metadata?.exists || !metadata?.ownerStreamId || !metadata?.pairStreamId) {
        return { 
          messages: [], 
          messageCount: 0,
          endingOwnerPointer: -1,
          endingPairPointer: -1,
          hasMoreMessages: false
        };
      }
      
      const result = await fetchAndDecryptMessages(
        suiClient as unknown as SuiClient,
        metadata.ownerStreamId,
        metadata.pairStreamId,
        metadata.ownerNextId || 0,
        metadata.pairNextId || 0,
        sharedKey
      );
      
      return {
        messages: result.messages,
        messageCount: result.messages.length,
        endingOwnerPointer: result.endingOwnerPointer,
        endingPairPointer: result.endingPairPointer,
        hasMoreMessages: result.hasMoreMessages
      };
    },
    enabled: metadata?.exists === true && !!metadata.ownerStreamId && !!metadata.pairStreamId,
    refetchOnWindowFocus: false,
  });
};

// Combined hook with loading older and checking for new messages
export const useChatMessages = (recipientAddress: string) => {
  const suiClient = useSuiClient();
  const { sharedKey } = useSharedKeyStore();
  const metadataQuery = useConversationMetadata(recipientAddress);
  const messagesQuery = useConversationMessages(recipientAddress, metadataQuery.data);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const {markConversationAsRead} = useConversationTracking();

  const { getActiveAccount} = useWalletAccountStore();
  
  // Load older messages function
  const loadOlderMessages = async () => {
    if (!metadataQuery.data?.exists || 
        !metadataQuery.data?.ownerStreamId || 
        !metadataQuery.data?.pairStreamId ||
        isLoadingOlder ||
        !messagesQuery.data?.hasMoreMessages) {
      return false;
    }
    
    try {
      setIsLoadingOlder(true);
      console.log("🔍 [loadOlderMessages] Loading older messages with ending pointers:", {
        ownerPointer: messagesQuery.data.endingOwnerPointer,
        pairPointer: messagesQuery.data.endingPairPointer
      });
      
      // Fetch older messages using the ending pointers from previous fetch
      const result = await fetchAndDecryptMessages(
        suiClient as unknown as SuiClient,
        metadataQuery.data.ownerStreamId,
        metadataQuery.data.pairStreamId,
        messagesQuery.data.endingOwnerPointer, // Use previous ending pointer
        messagesQuery.data.endingPairPointer,  // Use previous ending pointer
        sharedKey
      );
      
      if (result.messages.length > 0) {
        // Update the cache with the new older messages
        queryClient.setQueryData(['conversation-messages', recipientAddress], 
          (oldData: any = { 
            messages: [], 
            messageCount: 0,
            endingOwnerPointer: -1,
            endingPairPointer: -1,
            hasMoreMessages: false
          }) => {
            // Create a composite key combining conversation ID and message ID
            const existingMessageKeys = new Set(oldData.messages?.map((m: Message) => 
              `${recipientAddress}:${m.id}:${m.sender}:${m.timestamp}`
            ) || []);
            
            // Filter out any messages that already exist in the cache using the composite key
            const uniqueOlderMessages = result.messages.filter(m => 
              !existingMessageKeys.has(`${recipientAddress}:${m.id}:${m.sender}:${m.timestamp}`)
            );
            
            console.log(`🔍 [loadOlderMessages] Adding ${uniqueOlderMessages.length} unique older messages to cache`);
            
            // Combine old and new messages, then sort by timestamp (ascending)
            const messages = [...uniqueOlderMessages, ...(oldData.messages || [])].sort(
              (a, b) => Number(a.timestamp) - Number(b.timestamp)
            );
            
            // Return updated data including new ending pointers and hasMoreMessages flag
            return {
              ...oldData,
              messages,
              messageCount: messages.length,
              endingOwnerPointer: result.endingOwnerPointer,
              endingPairPointer: result.endingPairPointer,
              hasMoreMessages: result.hasMoreMessages
            };
          }
        );
        
        setIsLoadingOlder(false);
        return true;
      }
      
      setIsLoadingOlder(false);
      return false;
    } catch (error) {
      console.error("Error loading older messages:", error);
      setIsLoadingOlder(false);
      return false;
    }
  };
  
  // Check for new messages function with fix
  const checkForNewMessages = async () => {
    if (!metadataQuery.data?.exists || 
        !metadataQuery.data?.ownerStreamId || 
        !metadataQuery.data?.pairStreamId) {
      console.log("🔍 [checkForNewMessages] Skipping: invalid metadata state");
      return false;
    }
    
    console.log(`🔍 [checkForNewMessages] Start with ownerNextId=${metadataQuery.data.ownerNextId}, pairNextId=${metadataQuery.data.pairNextId}`);
    
    try {
      // Fetch only new messages
      const { messages: newMessages, newOwnerNextId, newPairNextId } = await fetchNewMessagesOnly(
        suiClient as unknown as SuiClient,
        metadataQuery.data.ownerStreamId,
        metadataQuery.data.pairStreamId,
        metadataQuery.data.ownerNextId || 0,
        metadataQuery.data.pairNextId || 0,
        sharedKey
      );

      console.log(`🔍 [checkForNewMessages] Results: ${newMessages.length} messages, newOwnerNextId=${newOwnerNextId}, newPairNextId=${newPairNextId}`);
      
      if (newMessages.length > 0) {
        console.log("🔍 [checkForNewMessages] Found new messages:", newMessages.map(m => ({
          id: m.id,
          sender: m.sender.substring(0, 10) + '...',
          timestamp: m.timestamp,
          content: m.decoded_content ? m.decoded_content.substring(0, 20) + '...' : 'encrypted'
        })));

        const activeAccount = await getActiveAccount()

        // what if where we mark the message as read with markConversationAsRead
        await markConversationAsRead(activeAccount?.publicKey!, recipientAddress, newPairNextId);



        
        // Update the cache with the same structure
        queryClient.setQueryData(['conversation-messages', recipientAddress], 
          (oldData: any = { 
            messages: [], 
            messageCount: 0,
            endingOwnerPointer: -1,
            endingPairPointer: -1,
            hasMoreMessages: false
          }) => {
            // Create a composite key combining conversation ID and message ID
            const existingMessageKeys = new Set(oldData.messages?.map((m: Message) => 
              `${recipientAddress}:${m.id}:${m.sender}:${m.timestamp}`
            ) || []);
            
            // Filter out any messages that already exist in the cache using the composite key
            const uniqueNewMessages = newMessages.filter(m => 
              !existingMessageKeys.has(`${recipientAddress}:${m.id}:${m.sender}:${m.timestamp}`)
            );
            
            console.log(`🔍 [checkForNewMessages] Adding ${uniqueNewMessages.length} unique messages to cache for conversation with ${recipientAddress}`);
            
            // Combine old and new messages, then sort by timestamp (ascending - older first, newer last)
            const messages = [...(oldData.messages || []), ...uniqueNewMessages].sort(
              (a, b) => Number(a.timestamp) - Number(b.timestamp)
            );
            
            return {
              ...oldData,
              messages,
              messageCount: messages.length,
              // FIX: Preserve hasMoreMessages flag from old data
              hasMoreMessages: oldData.hasMoreMessages
            };
          }
        );
        
        // Also update metadata with new next_id values
        // queryClient.setQueryData(['conversation-metadata', recipientAddress],
        //   (oldData: ConversationMetadata | undefined) => {
        //     if (!oldData) return oldData;
        //     console.log(`🔍 [checkForNewMessages] Updating metadata: ${oldData.ownerNextId} → ${newOwnerNextId}, ${oldData.pairNextId} → ${newPairNextId}`);
        //     return {
        //       ...oldData,
        //       ownerNextId: newOwnerNextId,
        //       pairNextId: newPairNextId
        //     };
        //   }
        // );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking for new messages:", error);
      return false;
    }
  };
  
  return {
    isLoading: messagesQuery.isLoading,
    isFetching: messagesQuery.isFetching,
    isLoadingOlder,
    data: messagesQuery.data,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
    checkForNewMessages,
    loadOlderMessages
  };
};

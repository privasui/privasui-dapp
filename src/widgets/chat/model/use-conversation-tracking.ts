import { generateConversationId } from "@/shared/cryptography";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the read state structure for each conversation
interface StreamReadState {
  pairNextId: number;
  lastViewedAt: number;
}

// Define the store shape
interface ConversationTrackingStore {
  // Map of recipient addresses to their read states
  readStates: Record<string, StreamReadState>;
  
  // Actions
  markConversationAsRead: (
    senderAddress: string,
    recipientAddress: string,
    pairNextId: number
  ) => void;
  
  calculateUnreadCount: (
    senderAddress: string,
    recipientAddress: string,
    currentPairNextId: number
  ) => number;
  
  getConversationReadState: (
    senderAddress: string,
    recipientAddress: string
  ) => StreamReadState | null;
  
  clearAllReadStates: () => void;
}

// Storage key for persistence
const CONVERSATION_TRACKING_KEY = "privasui_conversation_tracking";

// Create the Zustand store with persistence
export const useConversationTracking = create<ConversationTrackingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      readStates: {},
      
      // Mark a conversation as read up to specific next_id values
      markConversationAsRead: (
        senderAddress: string,
        recipientAddress: string,
        pairNextId: number
      ) => {
        const conversationKey = generateConversationId(senderAddress, recipientAddress);
        const currentState = get().readStates[`${conversationKey}::${recipientAddress}`];
        
        console.log(`🔍 [ConversationTracking] Marking as read: sender=${senderAddress.substring(0, 8)}..., recipient=${recipientAddress.substring(0, 8)}..., pairNextId=${pairNextId}`);
        if (currentState) {
          console.log(`🔍 [ConversationTracking] Previous state: pairNextId=${currentState.pairNextId}, diff=${pairNextId - currentState.pairNextId}`);
        }

        set((state) => ({
          readStates: {
            ...state.readStates,
            [`${conversationKey}::${recipientAddress}`]: {
              pairNextId,
              lastViewedAt: Date.now()
            }
          }
        }));
        
        console.log(`[ConversationTracking] Conversation ${recipientAddress} marked as read at indices: pair=${pairNextId}`);
      },
      
      // Calculate unread messages for a conversation
      calculateUnreadCount: (
        senderAddress: string,
        recipientAddress: string,
        currentPairNextId: number
      ) => {
        const { readStates } = get();
        const conversationKey = generateConversationId(senderAddress, recipientAddress);
        const savedState = readStates[`${conversationKey}::${recipientAddress}`];
        
        console.log(`🔍 [ConversationTracking] Calculating unread: recipient=${recipientAddress.substring(0, 8)}..., currentPairNextId=${currentPairNextId}`);
        
        // If no saved state, consider everything as read (first load)
        if (!savedState) {
          console.log(`🔍 [ConversationTracking] No saved state for ${recipientAddress.substring(0, 8)}..., returning 0`);
          return 0;
        }
        
        // Calculate difference in next_id values since last read
        const pairDiff = Math.max(0, currentPairNextId - savedState.pairNextId);
        
        console.log(`🔍 [ConversationTracking] Unread calculation: lastRead=${savedState.pairNextId}, current=${currentPairNextId}, diff=${pairDiff}`);
        return pairDiff;
      },
      
      // Get the saved read state for a conversation
      getConversationReadState: (senderAddress: string, recipientAddress: string): StreamReadState | null => {
        const { readStates } = get();
        const conversationKey = generateConversationId(senderAddress, recipientAddress);
        const result = readStates[`${conversationKey}::${recipientAddress}`] || null;
        
        console.log(`🔍 [ConversationTracking] Getting read state for ${recipientAddress.substring(0, 8)}...`, 
          result ? {
            pairNextId: result.pairNextId,
            lastViewedAt: new Date(result.lastViewedAt).toISOString()
          } : 'No saved state'
        );
        
        return result;
      },
      
      // Clear all read states (useful for logout)
      clearAllReadStates: () => {
        set({ readStates: {} });
      }
    }),
    {
      name: CONVERSATION_TRACKING_KEY,
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence across sessions
    }
  )
); 
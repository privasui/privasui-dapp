import { useEffect } from 'react';

interface MessagePollingOptions {
  chatExists: boolean | undefined;
  isAddressValid: boolean;
  checkForNewMessages: () => Promise<boolean>;
  onNewMessages: () => void;
  pollingInterval?: number;
}

export function useMessagePolling(options: MessagePollingOptions) {
  const { 
    chatExists, 
    isAddressValid, 
    checkForNewMessages, 
    onNewMessages,
    pollingInterval = 5000 // Default 5 seconds
  } = options;
  
  // Add polling for new messages
  useEffect(() => {
    if (!chatExists || !isAddressValid) return;
    
    const pollInterval = setInterval(async () => {
      console.log("🔍 [MessagePolling] Checking for new messages...");
      const hasNewMessages = await checkForNewMessages();
      if (hasNewMessages) {
        console.log("🔍 [MessagePolling] New messages found!");
        onNewMessages();
      }
    }, pollingInterval);
    
    return () => clearInterval(pollInterval);
  }, [chatExists, checkForNewMessages, isAddressValid, onNewMessages, pollingInterval]);

  // Provide a function to manually trigger a check
  const manuallyCheckForNewMessages = async () => {
    onNewMessages();
    const hasNewMessages = await checkForNewMessages();
    console.log("🔍 [MessagePolling] Manual check, new messages:", hasNewMessages);
    return hasNewMessages;
  };

  return {
    manuallyCheckForNewMessages
  };
} 
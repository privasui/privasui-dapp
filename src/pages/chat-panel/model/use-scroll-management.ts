import { useRef, useEffect, useState } from 'react';
import { Message } from '@/shared/types';

type ScrollOperation = 'initial-load' | 'load-more' | 'new-message';

interface ScrollManagementOptions {
  messages: Message[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isLoadingOlder: boolean;
}

export function useScrollManagement(options: ScrollManagementOptions) {
  const { messages, isLoading, isFetching, isLoadingOlder } = options;
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const oldScrollHeightRef = useRef<number>(0);
  const oldScrollTopRef = useRef<number>(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const lastOperationRef = useRef<ScrollOperation>('initial-load');

  // Auto-scroll management
  useEffect(() => {
    // Skip if no messages or still loading
    if(isLoading || isFetching) return;
    if (!messages?.length) return;
    
    // Only auto-scroll on initial load or new messages
    const shouldAutoScroll = 
      lastOperationRef.current === 'initial-load' || 
      lastOperationRef.current === 'new-message';
    
    // Skip auto-scrolling if we're loading older messages
    if (!shouldAutoScroll || isLoadingOlder || loadingOlder) {
      console.log('Skipping auto-scroll because:', { 
        operation: lastOperationRef.current,
        isLoadingOlder,
        loadingOlder
      });
      return;
    }
    
    // Use a small timeout to ensure DOM is updated
    const scrollTimeout = setTimeout(() => {
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        console.log('Auto-scrolling to bottom, operation:', lastOperationRef.current);
      }
    }, 100);
    
    return () => clearTimeout(scrollTimeout);
  }, [messages, isLoading, isFetching, isLoadingOlder, loadingOlder]);

  // Track initial load completion
  useEffect(() => {
    if (!isLoading && !isFetching && messages?.length && lastOperationRef.current === 'initial-load') {
      console.log('Initial load complete');
      // This is intentionally left as 'initial-load' to trigger the first auto-scroll
    }
  }, [isLoading, isFetching, messages]);

  // Helper to prepare for loading older messages
  const prepareLoadOlder = () => {
    if (scrollContainerRef.current) {
      // Save the current scroll position before adding more messages
      oldScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      oldScrollTopRef.current = scrollContainerRef.current.scrollTop;
      
      // Set operation type
      setLoadingOlder(true);
      lastOperationRef.current = 'load-more';
      
      return true;
    }
    return false;
  };

  // Helper to adjust scroll position after loading older messages
  const adjustScrollAfterLoadOlder = () => {
    // Small delay to ensure React has updated the DOM before we adjust scroll
    setTimeout(() => {
      if (scrollContainerRef.current) {
        // Calculate how much the content height has changed
        const newScrollHeight = scrollContainerRef.current.scrollHeight;
        const scrollHeightDifference = newScrollHeight - oldScrollHeightRef.current;
        
        // Adjust scroll position to maintain relative position
        scrollContainerRef.current.scrollTop = oldScrollTopRef.current + scrollHeightDifference;
        
        console.log('Adjusted scroll position after loading more:', {
          oldHeight: oldScrollHeightRef.current,
          newHeight: newScrollHeight,
          difference: scrollHeightDifference,
          newScrollTop: oldScrollTopRef.current + scrollHeightDifference,
          operation: lastOperationRef.current
        });
      }
      
      // Reset the saved values and loading state
      oldScrollHeightRef.current = 0;
      oldScrollTopRef.current = 0;
      setLoadingOlder(false);
      // We keep lastOperationRef as 'load-more' to prevent auto-scrolling
    }, 200);
  };

  // Mark that new messages are coming
  const prepareNewMessages = () => {
    lastOperationRef.current = 'new-message';
  };

  return {
    scrollContainerRef,
    messageEndRef,
    loadingOlder,
    prepareLoadOlder,
    adjustScrollAfterLoadOlder,
    prepareNewMessages
  };
} 
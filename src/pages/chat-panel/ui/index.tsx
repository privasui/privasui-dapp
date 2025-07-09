import { useNavigate, useParams } from "react-router";
import { useChatData } from "../model/use-chat-data";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useEffect, useMemo, useState, CSSProperties } from "react";
import { ChatPanelHeader } from "@/widgets/chat/ui/chat-panel-header";
import { RouteNames } from "@/routes";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useConversationTracking } from "@/widgets/chat/model/use-conversation-tracking";
import { useScrollManagement } from "../model/use-scroll-management";
import { useMessagePolling } from "../model/use-message-polling";
import { ChatInputContainer } from "./chat-input-container";
import { ErrorNotification } from "./error-notification";
import { MessageList } from "./message-list";
import { InvalidAddressMessage } from "./invalid-address-message";
import { LoadingSpinner } from "@/components/loading-spinner";

// Common styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    overflow: "hidden",
  } as CSSProperties,
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
    position: "relative",
    padding: "16px",
    paddingBottom: 0,
  } as CSSProperties,
  messagePanel: {
    flex: 1,
    border: "1px solid rgba(0, 255, 0, 0.3)",
    borderRadius: "12px",
    backgroundColor: "rgba(0, 0, 0)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    marginBottom: "16px",
  } as CSSProperties,
  centerContent: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
  } as CSSProperties,
};

// Helper function to validate Sui address
const isValidSuiAddress = (address: string): boolean => {
  // Sui addresses must start with '0x' and be 66 characters long (including '0x')
  return /^0x[a-fA-F0-9]{64}$/.test(address);
};

// Main ChatPanel component
export const ChatPanel = () => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const params = useParams();
  const { activeAccount } = useWalletAccountStore();
  const { markConversationAsRead } = useConversationTracking();
  const navigate = useNavigate();
  const [redirectCounter, setRedirectCounter] = useState(5); // 5 seconds for redirect

  // Use useMemo to derive stable values from params
  const recipientAddress = useMemo(
    () => params.receipentAddress as string,
    [params.receipentAddress],
  );

  // Check if the address is valid
  const isAddressValid = useMemo(() => {
    return isValidSuiAddress(recipientAddress);
  }, [recipientAddress]);

  console.log(
    `🔍 [ChatPanel] Mounting with recipient: ${recipientAddress}, valid: ${isAddressValid}`,
  );

  const {
    isLoading,
    isFetching,
    isLoadingOlder,
    data,
    error,
    refetchAll,
    checkForNewMessages,
    loadOlderMessages,
  } = useChatData(recipientAddress);

  useEffect(() => {
    if (data) {
      console.log(
        `🔍 [ChatPanel] Data loaded: exists=${data.exists}, messageCount=${data.messageCount}, hasMore=${data.hasMoreMessages}`,
      );
      console.log(
        `🔍 [ChatPanel] Stream info: ownerNextId=${data.ownerNextId}, pairNextId=${data.pairNextId}`,
      );

      if (data.messages && data.messages.length > 0) {
        console.log(
          `🔍 [ChatPanel] First message timestamp: ${data.messages[0].timestamp}`,
        );
        console.log(
          `🔍 [ChatPanel] Last message timestamp: ${data.messages[data.messages.length - 1].timestamp}`,
        );
      }
    }
  }, [data]);

  // Use the extracted scroll management hook
  const {
    scrollContainerRef,
    messageEndRef,
    loadingOlder,
    prepareLoadOlder,
    adjustScrollAfterLoadOlder,
    prepareNewMessages,
  } = useScrollManagement({
    messages: data?.messages,
    isLoading,
    isFetching,
    isLoadingOlder,
  });

  // Use the messaging polling hook
  const { manuallyCheckForNewMessages } = useMessagePolling({
    chatExists: data?.exists,
    isAddressValid,
    checkForNewMessages,
    onNewMessages: prepareNewMessages,
  });

  // If address is invalid, redirect to chat list after a short delay
  useEffect(() => {
    if (!isAddressValid) {
      const timer = setInterval(() => {
        setRedirectCounter((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(`/${RouteNames.Pim}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAddressValid, navigate]);

  const handleMessageSent = async () => {
    await manuallyCheckForNewMessages();
  };

  const handlePaymentSent = () => {
    setUpdateTrigger((prev) => prev + 1);
  };

  // Handle loading older messages
  const handleLoadMoreClick = async () => {
    if (prepareLoadOlder()) {
      await loadOlderMessages();
      adjustScrollAfterLoadOlder();
    }
  };

  useEffect(() => {
    if (data?.pairNextId && activeAccount?.publicKey) {
      console.log(
        `🔍 [ChatPanel] Marking as read: pairNextId=${data.pairNextId}`,
      );
      markConversationAsRead(
        activeAccount.publicKey,
        recipientAddress,
        data.pairNextId,
      );
    }
  }, [
    data?.pairNextId,
    activeAccount?.publicKey,
    markConversationAsRead,
    recipientAddress,
  ]);

  // If the address is invalid, show an error message using the extracted component
  if (!isAddressValid) {
    return (
      <InvalidAddressMessage
        address={recipientAddress}
        redirectCounter={redirectCounter}
        onNavigateToChats={() => navigate(`/${RouteNames.Pim}`)}
      />
    );
  }

  const hasMessages = data?.messages && data.messages.length > 0;

  return (
    <div style={styles.container}>
      {/* Fixed header that stays at the top */}
      <ChatPanelHeader
        key={`header-${updateTrigger}`}
        recipientAddress={recipientAddress}
        onBackClick={() => navigate(`/${RouteNames.Pim}`)}
      />

      {/* Main content container */}
      <div style={styles.contentContainer}>
        {/* Error notification if present */}
        {error && <ErrorNotification onRetry={refetchAll} />}

        {/* Message panel with green border */}
        <div style={styles.messagePanel}>
          {isLoading || isFetching ? (
            <div style={styles.centerContent}>
              <LoadingSpinner />
            </div>
          ) : hasMessages ? (
            <MessageList
              messages={data.messages}
              currentUserPublicKey={activeAccount?.publicKey || ""}
              hasMoreMessages={data.hasMoreMessages}
              isLoadingOlder={isLoadingOlder || loadingOlder}
              onLoadMoreClick={handleLoadMoreClick}
              scrollContainerRef={scrollContainerRef}
              messageEndRef={messageEndRef}
            />
          ) : (
            // No messages available
            <div style={styles.centerContent}>
              <EmptyState
                icon={MessageSquare}
                title="No messages yet."
                description="Start the conversation by typing below!"
              />
            </div>
          )}
        </div>

        {/* Input area fixed at bottom */}
        <ChatInputContainer
          isNewChat={data?.exists === true ? false : true}
          recipientAddress={recipientAddress}
          onComplete={handleMessageSent}
          onPaymentSent={handlePaymentSent}
        />
      </div>
    </div>
  );
};

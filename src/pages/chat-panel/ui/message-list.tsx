import { Message } from "@/shared/types";
import { MessageBubble } from "./message-bubble";
import { LoadMoreButton } from "./load-more-button";

interface MessageListProps {
  messages: Message[];
  currentUserPublicKey: string;
  hasMoreMessages: boolean;
  isLoadingOlder: boolean;
  onLoadMoreClick: () => Promise<void>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList = ({ 
  messages, 
  currentUserPublicKey, 
  hasMoreMessages,
  isLoadingOlder,
  onLoadMoreClick,
  scrollContainerRef,
  messageEndRef
}: MessageListProps) => {
  return (
    <div 
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }}
    >
      {/* Load More button */}
      {hasMoreMessages && (
        <LoadMoreButton 
          onLoadMore={onLoadMoreClick}
          isLoading={isLoadingOlder}
        />
      )}
      
      {/* Message bubbles */}
      {messages.map((message: Message, index: number) => (
        <div key={`${message.timestamp}-${index}`}>
          <MessageBubble
            message={message.decoded_content || "Can't decrypt message"}
            timestamp={message.timestamp}
            isCurrentUser={message.sender === currentUserPublicKey}
            objectId={message.id}
            digest={message.digest}
          />
        </div>
      ))}
      {/* This invisible element is used to scroll to bottom */}
      <div ref={messageEndRef} />
    </div>
  );
}; 
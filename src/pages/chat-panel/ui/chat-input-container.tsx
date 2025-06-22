import { ChatInput } from "../../../widgets/chat/ui/chat-input";
import { CSSProperties } from "react";

interface ChatInputContainerProps {
  isNewChat: boolean;
  recipientAddress: string;
  onComplete: () => Promise<void>;
  onPaymentSent: () => void;
}

const styles = {
  container: {
    padding: "0",
    position: "sticky",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 10
  } as CSSProperties
};

export const ChatInputContainer = ({
  isNewChat,
  recipientAddress,
  onComplete,
  onPaymentSent
}: ChatInputContainerProps) => (
  <div style={styles.container}>
    <ChatInput 
      isNewChat={isNewChat}
      recipientAddress={recipientAddress}
      onComplete={onComplete}
      onPaymentSent={onPaymentSent}
    />
  </div>
); 
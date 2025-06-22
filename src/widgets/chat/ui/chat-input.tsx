import { TypeInput } from "@/components/type-input";
import { Box } from "@radix-ui/themes";
import { Send, Loader } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useSharedKeyStore } from "@/widgets/profile/model/use-shared-key";
import { encryptMessageWithSharedKey, fromHex } from "@/shared/cryptography";
import { useCreateConversation } from "../model/use-create-conversation";
import { useSuiPayment } from "../model/use-sui-payment";
import { useSendMessage } from "../model/use-send-message";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { addToast } from "@/widgets/toast/model/use-toast";
// Add proper interface for component props
interface ChatInputProps {
  isNewChat: boolean;
  recipientAddress?: string;
  onComplete: () => void;
  onPaymentSent: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isNewChat,
  recipientAddress,
  onComplete,
  onPaymentSent,
}) => {
  // console.log("🔍 [ChatInput] isNewChat:", isNewChat);
  // console.log("🔍 [ChatInput] recipientAddress:", recipientAddress);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { sharedKey } = useSharedKeyStore();
  const { mutateAsync: createConversation } = useCreateConversation();
  const { mutateAsync: sendMessage } = useSendMessage();
  const { mutateAsync: sendSuiPayment } = useSuiPayment();
  const { activeAccount } = useWalletAccountStore();

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!activeAccount) {
    return;
  }

  if (!recipientAddress) {
    return;
  }

  // i want to check if message is sui:pay 0.3 then we should do some other logic
  // so i should first trim message and then check if it has 2 parts first part should be sui:send and second part should be transfered to a toFixed 2 number

  const extractSuiAmountFromMessage = (message: string): number => {
    // console.log("🔍 [ChatInput] isSuiPayment message:", message);
    const parts = message.trim().split(" ");
    if (parts.length !== 2) return -1;
    if (parts[0] !== "/sui:send") return -1;
    if (isNaN(Number(parts[1]))) return -1;
    const amount = Number(parts[1]);
    if (amount < 0.01) return -1;
    // console.log("🔍 [ChatInput] isSuiPayment:", amount);
    return amount;
  };

  const processSend = async () => {
    if (!inputMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const messageToSend = inputMessage;
      setInputMessage(""); // Clear input right away for better UX

      const suiAmount = extractSuiAmountFromMessage(inputMessage);
      const mistAmount = BigInt(suiAmount * 10 ** 9);
      if (suiAmount !== -1) {
        // console.log("🔍 [ChatInput] suiAmount:", suiAmount);
        try {
          await sendSuiPayment({
            recipient: recipientAddress,
            mistAmount: mistAmount,
            onComplete: async () => {
              setIsSending(false);
              setInputMessage("");
              addToast.success("SUI payment sent successfully");
              onPaymentSent();
              // await onComplete();
            },
            onError: async (error: Error) => {
              // console.log("🔍 [ChatInput] onError sendSuiPayment", error);
              setIsSending(false);
              setInputMessage(messageToSend);
              addToast.error(addToast.formatError(error));
            },
          });
        } catch (error) {
          console.error("Error sending SUI payment:", error);
          setIsSending(false);
          setInputMessage(messageToSend);
          addToast.error(
            addToast.formatError(
              error instanceof Error
                ? error
                : new Error("Failed to send payment"),
            ),
          );
        }
        return;
      }

      const encryptedMessage = await encryptMessageWithSharedKey(
        fromHex(sharedKey),
        messageToSend,
      );
      // console.log("🔍 [ChatInput] inputMessage:", messageToSend);
      // console.log("🔍 [ChatInput] encryptedMessage:", encryptedMessage);

      if (isNewChat) {
        // console.log("🔍 [ChatInput] creating conversation");
        try {
          await createConversation({
            recipient: recipientAddress,
            encryptedMessage: encryptedMessage,
            onComplete: () => {
              // console.log("🔍 [ChatInput] onComplete createConversation");
              window.location.reload();
            },
            onError: (error: Error) => {
              // console.log("🔍 [ChatInput] onError createConversation", error);
              setIsSending(false);
              setInputMessage(messageToSend);
              addToast.error(addToast.formatError(error));
            },
          });
        } catch (error) {
          console.error("Error creating conversation:", error);
          setIsSending(false);
          setInputMessage(messageToSend);
          addToast.error(
            addToast.formatError(
              error instanceof Error
                ? error
                : new Error("Failed to create conversation"),
            ),
          );
        }
      } else {
        // console.log("🔍 [ChatInput] sending message");
        try {
          await sendMessage({
            recipient: recipientAddress,
            encryptedMessage: encryptedMessage,
            onComplete: async () => {
              // console.log("🔍 [ChatInput] onComplete sendMessage");
              await onComplete();
              // TODO: I want to wait for the transaction to be processed
              setIsSending(false);
              setInputMessage("");
            },
            onError: async (error: Error) => {
              // console.log("🔍 [ChatInput] onError sendMessage", error);
              setIsSending(false);
              setInputMessage(messageToSend);
              addToast.error(addToast.formatError(error));
            },
          });
        } catch (error) {
          console.error("Error sending message:", error);
          setIsSending(false);
          setInputMessage(messageToSend);
          addToast.error(
            addToast.formatError(
              error instanceof Error
                ? error
                : new Error("Failed to send message"),
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error in message processing:", error);
      setIsSending(false);
      setInputMessage(inputMessage || ""); // Restore original message
      addToast.error(
        addToast.formatError(
          error instanceof Error
            ? error
            : new Error("Error processing message"),
        ),
      );
    }
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault(); // Prevent form submission reload
    await processSend();
  };

  // Updated key handler that's device-aware
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    console.log(
      "Key pressed:",
      e.key,
      "Shift key:",
      e.shiftKey,
      "Is mobile:",
      isMobile,
    );

    if (e.key === "Enter") {
      if (isMobile) {
        // On mobile, Enter always creates a new line
        // Users will tap the Send button to send
        return;
      } else {
        // On desktop, Enter sends and Shift+Enter creates a new line
        if (e.shiftKey) {
          console.log("Shift+Enter pressed - allowing new line");
          return;
        } else {
          console.log("Enter pressed - sending message");
          e.preventDefault();
          processSend();
        }
      }
    }
  };

  return (
    <form
      onSubmit={handleSendMessage}
      style={{ margin: 0, position: "relative", zIndex: 10 }}
    >
      <Box
        style={{
          paddingBottom: "12px",
          // backgroundColor: "rgba(0, 255, 0, 0.05)",
          borderRadius: "12px",
        }}
      >
        <TypeInput
          multiline
          textAreaProps={{
            rows: 2,
            value: inputMessage,
            onChange: (e) => setInputMessage(e.target.value),
            onKeyDown: handleKeyDown,
            placeholder: isSending
              ? "Sending message transaction ..."
              : "Type a message...",
            disabled: isSending,
          }}
          buttonProps={{
            disabled: !isSending && !inputMessage.trim(),
            children: (
              <>
                {isSending ? (
                  <Loader className="animate-spin" size={14} />
                ) : (
                  <Send size={14} />
                )}
              </>
            ),
          }}
        />
        {isMobile && (
          <div
            style={{
              fontSize: "12px",
              opacity: 0.5,
              marginTop: "4px",
              textAlign: "center",
            }}
          >
            Press Enter for new line, tap Send to send
          </div>
        )}
      </Box>
    </form>
  );
};

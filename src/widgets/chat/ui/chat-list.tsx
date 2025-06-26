import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TypeInput } from "@/components/type-input";
import { useMessageStreams } from "@/pages/chat-list/model/use-message-streams";
import { MessageStream } from "@/shared/types";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { MessageSquareOff, Send, ShoppingBag } from "lucide-react";
import { ReactNode, useMemo, useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { ChatConversationItem } from "./chat-conversation-item";
import { useSuiClient } from "@mysten/dapp-kit";
import { getNameAddress } from "@/shared/suipi";

export type FormValues = {
  address: string;
};

const schema = yup.object({
  address: yup
    .string()
    // We're handling the required message with our custom state
    .required()
    .test("is-valid-input", "Not valid Sui address or piNS name (i.e. @bob.pi)", (value) => {
      // Allow piNS names starting with @
      if (value?.startsWith("@")) {
        return true;
      }
      
      // For regular Sui addresses, apply the original validation
      return (
        value?.startsWith("0x") &&
        value?.length === 66 &&
        /^0x[0-9a-fA-F]{64}$/.test(value || "")
      );
    }),
});

export const ChatList = () => {
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  const [isCheckingPiNS, setIsCheckingPiNS] = useState(false);
  const [piNSAddress, setPiNSAddress] = useState<string | null>(null);
  const [piNSError, setPiNSError] = useState<string | null>(null);
  const [showBuyButton, setShowBuyButton] = useState(false);
  const [isEmptyInput, setIsEmptyInput] = useState(true); // Track if input is empty

  const addressForm = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      address: "",
    },
    resolver: yupResolver(schema),
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = addressForm;

  const inputValue = watch("address");

  // Track if input is empty
  useEffect(() => {
    setIsEmptyInput(!inputValue || inputValue.trim() === "");
  }, [inputValue]);

  // Check for piNS name when input changes
  useEffect(() => {
    const checkPiNSName = async () => {
      // Reset states
      setPiNSAddress(null);
      setPiNSError(null);
      setShowBuyButton(false);

      // Only process if it's a piNS name format
      if (inputValue && inputValue.startsWith("@")) {
        // If only "@" is entered, show a helpful message in green
        if (inputValue === "@") {
          setPiNSError("Enter piNS name (i.e. @elon.pi)");
          // Set a flag to indicate this is a suggestion, not an error
          setPiNSAddress("suggestion"); // Using this state to trigger green color
          return;
        }
        
        // Check if the name ends with .pi
        if (!inputValue.endsWith(".pi")) {
          setPiNSError("Enter valid piNS name (i.e. @elon.pi)");
          return;
        }
        
        setIsCheckingPiNS(true);
        try {
          // Extract the name without @ and .pi
          let nameToCheck = inputValue.substring(1, inputValue.length - 3); // Remove @ and .pi
          
          // Check if name exists
          const address = await getNameAddress(suiClient as any, nameToCheck);
          
          if (address) {
            // Name exists, set the address
            setPiNSAddress(address);
            // Show address in green instead of error
            setPiNSError(`Sui Address: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
            setShowBuyButton(false);
          } else {
            // Name doesn't exist, show buy option
            setPiNSAddress(null);
            setPiNSError(`💎 ${inputValue} is not registered. Buy it now!`);
            setShowBuyButton(true);
          }
        } catch (error) {
          console.error("Error checking piNS name:", error);
          setPiNSError("Error checking name availability");
          setShowBuyButton(false);
        } finally {
          setIsCheckingPiNS(false);
        }
      }
    };

    // Use debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      checkPiNSName();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputValue, suiClient]);

  const {
    data: messageStreams,
    isLoading: isMessageStreamsLoading,
    isFetching: isMessageStreamsFetching,
  } = useMessageStreams();

  const { activeAccount } = useWalletAccountStore();

  const hasStreams = messageStreams && messageStreams.length > 0;

  // Sort message streams to put saved messages at the top
  const sortedMessageStreams = useMemo(() => {
    if (!messageStreams) return [];

    return [...messageStreams].sort((a, b) => {
      // If a is saved messages (owner === pair), it goes first
      if (a.owner === a.pair && a.owner === activeAccount?.publicKey) return -1;
      // If b is saved messages, it goes first
      if (b.owner === b.pair && b.owner === activeAccount?.publicKey) return 1;
      // Otherwise, keep original order
      return 0;
    });
  }, [messageStreams, activeAccount]);

  const onSubmit = (values: FormValues) => {
    // If it's a piNS name and we have the address, use that
    if (values.address.startsWith("@") && piNSAddress) {
      navigate(`/chats/${piNSAddress}`);
    } else if (!values.address.startsWith("@")) {
      // Regular Sui address
      navigate(`/chats/${values.address.trim()}`);
    }
  };

  const handleBuyName = () => {
    // Extract the name without @ and .pi
    // We know it ends with .pi because we validate that before showing the buy button
    let nameToRegister = inputValue.substring(1, inputValue.length - 3); // Remove @ and .pi
    
    // Navigate to buy-pins page
    navigate(`/buy-pins?name=${nameToRegister}`);
  };

  let content: ReactNode;

  if (isMessageStreamsLoading || isMessageStreamsFetching) {
    content = <LoadingSpinner />;
  } else if (!hasStreams) {
    content = (
      <EmptyState
        icon={MessageSquareOff}
        title="You don't have any conversations."
        description="Start chat by entering a Sui address or piNS name (@trump.pi)."
      />
    );
  } else {
    content = (
      <div className="w-full flex flex-1 h-full overflow-auto border border-primary/15 flex-col rounded-2xl bg-black">
        {sortedMessageStreams.map((stream: MessageStream) => (
          <ChatConversationItem
            key={stream.id}
            owner={stream.owner}
            pair={stream.pair}
            ownerStreamId={stream.id}
            pairStreamId={stream.pair_stream}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[1000px] flex-1 my-0 mx-auto overflow-hidden gap-5">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <TypeInput
              inputProps={{
                ...field,
                placeholder: "Sui address or piNS name",
                autoComplete: "off",
                name: "sui-address-or-pins-input",
                type: "text",
                "data-1p-ignore": "",
                "data-lpignore": "true",
                "data-protonpass-ignore": "true",
                "data-form-type": "other",
              } as React.InputHTMLAttributes<HTMLInputElement>}
              buttonProps={
                showBuyButton
                  ? {
                      children: (
                        <>
                          <ShoppingBag size={14} />
                          Buy Now
                        </>
                      ),
                      type: "button",
                      onClick: handleBuyName,
                    }
                  : {
                      children: (
                        <>
                          <Send size={14} />
                          Start Chat
                        </>
                      ),
                      type: "submit",
                      disabled: 
                        !addressForm.formState.isValid || 
                        isCheckingPiNS || 
                        (inputValue?.startsWith("@") && (inputValue === "@" || !inputValue.endsWith(".pi") || !piNSAddress)),
                    }
              }
              infoText={
                isCheckingPiNS
                  ? "Checking piNS name ..."
                  : isEmptyInput
                  ? "Enter Sui address or piNS name (i.e. @elon.pi) to chat"
                  : piNSError || errors.address?.message
              }
              infoClassname={
                isCheckingPiNS
                  ? "text-primary"
                  : showBuyButton
                  ? "text-yellow-500"
                  : piNSAddress || isEmptyInput
                  ? "!text-[#00ff00]" 
                  : "text-red-500"
              }
            />
          )}
        />
      </form>
      <div className="flex-1 overflow-auto">{content}</div>
    </div>
  );
};

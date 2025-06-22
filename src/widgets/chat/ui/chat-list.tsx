import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TypeInput } from "@/components/type-input";
import { useMessageStreams } from "@/pages/chat-list/model/use-message-streams";
import { MessageStream } from "@/shared/types";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { MessageSquareOff, Send } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { ChatConversationItem } from "./chat-conversation-item";

export type FormValues = {
  address: string;
};

const schema = yup.object({
  address: yup
    .string()
    .required()
    .test("is-hex-prefix", "Sui address must start with '0x'", (value) => {
      console.log(value);
      return value?.startsWith("0x");
    })
    .test(
      "is-correct-length",
      "Invalid Sui address length",
      (value) => value?.length === 66,
    )
    .test("is-hex-format", "Address must be hexadecimal", (value) =>
      /^0x[0-9a-fA-F]{64}$/.test(value || ""),
    ),
});

export const ChatList = () => {
  const navigate = useNavigate();

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
    formState: { errors },
  } = addressForm;

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
    navigate(`/chats/${values.address.trim()}`);
  };

  let content: ReactNode;

  if (isMessageStreamsLoading || isMessageStreamsFetching) {
    content = <LoadingSpinner />;
  } else if (!hasStreams) {
    content = (
      <EmptyState
        icon={MessageSquareOff}
        title="You don't have any conversations."
        description="Enter a Sui address above and click 'Start Chat' to begin a new conversation."
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
                placeholder: "Enter a Sui address",
              }}
              buttonProps={{
                children: (
                  <>
                    <Send size={14} />
                    Start Chat
                  </>
                ),
                type: "submit",
                disabled: !addressForm.formState.isValid,
              }}
              infoText={errors.address?.message}
            />
          )}
        />
      </form>
      <div className="flex-1 overflow-auto">{content}</div>
    </div>
  );
};

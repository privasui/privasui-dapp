import { cn } from "@/shared/utils";
import { Account } from "@/widgets/profile/model/use-wallet-accounts";
import { User } from "lucide-react";
import { FC } from "react";

export interface IAccountListRowProps {
  account: Account;
  onSelect?: (uid: string) => void;
  className?: string;
}

export const AccountListRow: FC<IAccountListRowProps> = (props) => {
  const { account, onSelect, className } = props;

  return (
    <div
      onClick={() => onSelect?.(account.uid)}
      key={account.uid}
      className={cn(
        "w-full flex items-center justify-between border border-primary/30 p-3 rounded-[0.6rem] bg-muted",
        {
          "cursor-pointer": !!onSelect,
        },
        className,
      )}
    >
      <div className="flex font-mono flex-row gap-3 items-center">
        <User size={16} />
        {account.name || "Unnamed Account"}
      </div>
      <span className="font-mon font-medium">
        {account.publicKey.slice(0, 6)}...
        {account.publicKey.slice(-4)}
      </span>
    </div>
  );
};

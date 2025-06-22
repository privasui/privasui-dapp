import { cn } from "@/shared/utils";
import { FC, PropsWithChildren } from "react";

export interface IPrivasuiHeaderProps extends PropsWithChildren {
  className?: string;
  onClick?: () => void;
}

export const PrivasuiHeader: FC<IPrivasuiHeaderProps> = ({
  children,
  className,
  onClick,
}) => {
  return (
    <div className={cn("w-full flex items-center flex-row pb-4", className)}>
      <h1
        onClick={onClick}
        className="text-primary text-xl font-bold font-mono cursor-pointer transition-text-shadow hover:text-shadow-sm shadow-2xl text-shadow-primary/60"
      >
        Privasui
      </h1>
      <div className="flex flex-1 justify-end">{children}</div>
    </div>
  );
};

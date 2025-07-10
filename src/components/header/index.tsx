import { cn } from "@/shared/utils";
import { FC, PropsWithChildren, ReactNode } from "react";

export interface IPrivasuiHeaderProps extends PropsWithChildren {
  className?: string;
  onClick?: () => void;
  title?: string | ReactNode;
}

export const PrivasuiHeader: FC<IPrivasuiHeaderProps> = ({
  children,
  className,
  onClick,
  title = "Privasui",
}) => {
  return (
    <div className={cn("w-full flex items-center flex-row pb-4", className)}>
      <div
        onClick={onClick}
        className="text-primary text-xl font-bold font-mono cursor-pointer transition-text-shadow hover:text-shadow-sm shadow-2xl text-shadow-primary/60 flex items-center gap-2"
      >
        {title}
      </div>
      <div className="flex flex-1 justify-end">{children}</div>
    </div>
  );
};

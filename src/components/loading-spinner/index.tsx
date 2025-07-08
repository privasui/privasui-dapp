import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center text-primary">
      <Loader2 size={20} className={cn("animate-spin", className)} />
    </div>
  );
}

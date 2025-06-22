import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex items-center text-primary">
      <Loader2 size={20} className="animate-spin" />
    </div>
  );
}

import { Button } from "@radix-ui/themes";
import { RefreshCw } from "lucide-react";

interface ErrorNotificationProps {
  onRetry: () => void;
}

export const ErrorNotification = ({ onRetry }: ErrorNotificationProps) => (
  <div style={{
    padding: "12px",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}>
    <span style={{ color: "#ff4040" }}>Error loading messages</span>
    <Button onClick={onRetry}>
      <RefreshCw size={16} /> Retry
    </Button>
  </div>
); 
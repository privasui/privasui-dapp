import { Button } from "@radix-ui/themes";
import { ChevronUp } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";

interface LoadMoreButtonProps {
  onLoadMore: () => Promise<void>;
  isLoading: boolean;
}

export const LoadMoreButton = ({ onLoadMore, isLoading }: LoadMoreButtonProps) => {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center",
      marginBottom: "12px" 
    }}>
      <Button 
        onClick={onLoadMore}
        disabled={isLoading}
        style={{
          backgroundColor: "transparent",
          border: "none",
          color: "rgba(0, 255, 0, 0.7)",
          fontSize: "12px",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer"
        }}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <ChevronUp size={12} />
        )}
        {isLoading ? "Loading..." : "Load earlier messages"}
      </Button>
    </div>
  );
}; 
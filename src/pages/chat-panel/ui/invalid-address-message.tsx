import { Button } from "@radix-ui/themes";
import { AlertCircle } from "lucide-react";

interface InvalidAddressProps {
  address: string;
  redirectCounter: number;
  onNavigateToChats: () => void;
}

// Helper function to format a long address for display
const formatAddressForDisplay = (address: string): string => {
  if (!address || address.length < 24) return address;
  return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
};

export const InvalidAddressMessage = ({ address, redirectCounter, onNavigateToChats }: InvalidAddressProps) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      overflow: "hidden",
      padding: "16px",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px"
    }}>
      <div style={{
        padding: "24px",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        borderRadius: "12px",
        maxWidth: "400px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        border: "1px solid rgba(255, 0, 0, 0.3)"
      }}>
        <AlertCircle size={48} color="#ff4040" />
        <h2 style={{ color: "#ff4040", margin: 0 }}>Invalid Sui Address</h2>
        <p style={{ color: "#ff4040", margin: 0 }}>
          The address "{formatAddressForDisplay(address)}" is not a valid Sui address.
        </p>
        <p style={{ color: "#ff4040", margin: "8px 0 0 0", fontSize: "14px" }}>
          Redirecting in <span style={{ fontWeight: "bold" }}>{redirectCounter}</span> seconds...
        </p>
      </div>
      
      <Button 
        onClick={onNavigateToChats}
        style={{
          backgroundColor: "rgba(0, 255, 0, 0.2)",
          color: "#00ff00",
          padding: "10px 24px",
          fontSize: "16px"
        }}
      >
        Return to Chat List
      </Button>
    </div>
  );
}; 
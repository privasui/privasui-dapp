import { Box, Text } from "@radix-ui/themes";
import { ExternalLink } from "lucide-react";
import React from "react";
import { isDevnet, isMainnet, isTestnet } from "@/shared/network-config";

export const MessageBubble = ({
  objectId,
  message,
  timestamp,
  isCurrentUser,
  digest,
}: {
  objectId: string;
  message: string;
  timestamp: string;
  isCurrentUser: boolean;
  digest?: string;
}) => {

  const getSuiVisionUrl = (objectId: string, _txDigest: string) => {
    let networkPrefix; // Default fallback
    
    if (isDevnet()) {
      networkPrefix = "devnet";
    } else if (isTestnet()) {
      networkPrefix = "testnet";
    } else if (isMainnet()) {
      networkPrefix = "";
    }
    
    return `https://${networkPrefix ? networkPrefix + '.' : ''}suivision.xyz/object/${objectId}`;
  };

  // Format message to preserve line breaks
  const formattedMessage = React.useMemo(() => {
    return message.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < message.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }, [message]);

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isCurrentUser ? "flex-end" : "flex-start",
        gap: "4px",
      }}
    >
      <Box
        style={{
          maxWidth: "70%",
          backgroundColor: isCurrentUser
            ? "rgba(0, 255, 0, 0.1)"
            : "rgba(255, 255, 255, 0.05)",
          padding: "12px",
          borderRadius: "12px",
          borderBottomRightRadius: isCurrentUser ? "4px" : "12px",
          borderBottomLeftRadius: isCurrentUser ? "12px" : "4px",
        }}
      >
        <div
          style={{
            color: isCurrentUser ? "#00ff00" : "white",
            fontSize: "14px",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap", // This preserves whitespace including line breaks
            fontFamily: "inherit", // Inherit font from parent to maintain consistent styling
          }}
        >
          {formattedMessage}
        </div>
      </Box>
      <Box
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginLeft: isCurrentUser ? "0" : "8px",
          marginRight: isCurrentUser ? "8px" : "0",
        }}
      >
        <Text
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "11px",
          }}
        >
          {new Date(parseInt(timestamp)).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        
        {digest && (
          <a
            href={getSuiVisionUrl(objectId, digest)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              color: isCurrentUser ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 255, 255, 0.5)",
              fontSize: "11px",
              textDecoration: "none",
              gap: "2px",
            }}
            title="View message object on SuiVision"
          >
            <ExternalLink size={10} />
            <span>SuiVision</span>
          </a>
        )}
      </Box>
    </Box>
  );
};
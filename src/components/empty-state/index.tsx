import React from 'react';
import { Text } from "@radix-ui/themes";
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconSize?: number;
  iconColor?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  iconSize = 64,
  iconColor = "#00ff00",
  className = "",
}) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center py-20 ${className}`}>
      <Icon 
        size={iconSize} 
        color={iconColor} 
        style={{ 
          opacity: 0.6,
          filter: "drop-shadow(0 0 10px rgba(0, 255, 0, 0.3))",
          marginBottom: "20px"
        }} 
      />
      <Text 
        size="4" 
        style={{ 
          color: "#00ff00", 
          opacity: 0.8,
          textAlign: "center",
          fontFamily: "monospace"
        }}
      >
        {title}
      </Text>
      {description && (
        <Text 
          size="2" 
          style={{ 
            color: "#00ff00", 
            opacity: 0.6,
            textAlign: "center",
            maxWidth: "300px",
            marginTop: "8px",
            fontFamily: "monospace"
          }}
        >
          {description}
        </Text>
      )}
    </div>
  );
}; 
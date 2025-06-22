import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Standard page container that ensures content fits within mobile viewport
 * with proper internal scrolling areas
 */
export const PageContainer = ({
  children,
  header,
  footer,
  fullWidth = false,
}: PageContainerProps) => {
  return (
    <div
      className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden relative my-0 mx-auto p-4"
      style={{ 
        maxWidth: fullWidth ? "100%" : "800px", 
        margin: "0 auto",
        scrollbarGutter: "stable" // Creates space for the scrollbar to prevent layout shifts
      }}>

      {header && <div className="w-full">{header}</div>}
      
      <div className="w-full flex flex-1 flex-col overflow-auto">
        {children}
      </div>
      {footer && <div className="w-full">{footer}</div>}
    </div>
  );
};

// src/components/ui/Drawer.tsx
import * as React from "react";   // Adjust if needed
import { useEffect, useState } from "react";
import {
  DrawerContent,
  DrawerFooter,
  Drawer as ShadcnDrawer,
} from "@/shared/ui/drawer";


interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerContent?: React.ReactNode; // Add new prop for persistent footer content
  showClose?: boolean;
  maxWidth?: string; // e.g. "max-w-[800px]"
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  children,
  footer,
  footerContent,
  maxWidth = "max-w-[800px]",
}) => {
  const [drawerHeight, setDrawerHeight] = useState<string | undefined>(undefined);

  useEffect(() => {
    function updateHeight() {
      // Prefer visualViewport for mobile browsers
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      setDrawerHeight(`${height}px`);
    }
    updateHeight();
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <ShadcnDrawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="focus:outline-none bg-black text-foreground border-2 border-primary flex flex-col min-h-0"
        style={{ maxHeight: drawerHeight }}
      >
        <div className="w-full flex justify-center flex-1 min-h-0">
          <div className={`w-full ${maxWidth} flex flex-col min-h-0`}>
            {/* Main content with scrolling */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="w-full px-4">
                {children}
              </div>
            </div>
            
            {footer && <DrawerFooter>{footer}</DrawerFooter>}
          </div>
        </div>
        
        {/* Fixed footer content that stays at the bottom */}
        {footerContent && (
          <div className="sticky bottom-0 w-full flex justify-center items-center py-4 bg-black border-t border-primary/20 mt-auto z-10">
            {footerContent}
          </div>
        )}
      </DrawerContent>
    </ShadcnDrawer>
  );
};
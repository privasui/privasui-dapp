import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { cn } from "@/shared/utils";
import { ArrowLeft, X } from "lucide-react";
import { AccountSend } from './account-send';
import { AccountReceive } from './account-receive';
import { AccountHistory } from './account-history';
import { AccountMore } from './account-more';

type DrawerView = 'main' | 'send' | 'receive' | 'history' | 'more';

interface AccountDrawerProps {
  children: React.ReactNode;
  address: string;
  balance: number;
  onClose?: () => void;
}

export interface DrawerManagerRef {
  navigateTo: (view: DrawerView) => void;
  activeView: DrawerView;
}

// Header component for consistent UI across views
const DrawerHeader: React.FC<{
  activeView: DrawerView;
  onBack: () => void;
  onClose?: () => void;
  viewTitles: Record<Exclude<DrawerView, 'main'>, string>;
}> = ({ activeView, onBack, onClose, viewTitles }) => (
  <div className="flex items-center justify-between pt-4">
    {/* Back text */}
    <div className="w-[80px] flex items-center">
      {activeView !== 'main' && (
        <div
          onClick={onBack}
          className="flex items-center cursor-pointer text-[#00ff00]"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </div>
      )}
    </div>

    {/* Centered title */}
    <div className="flex-1 flex justify-center">
      {activeView !== 'main' && (
        <span className="text-lg text-[#00ff00] font-mono font-bold">
          {viewTitles[activeView as Exclude<DrawerView, 'main'>]}
        </span>
      )}
    </div>

    {/* Close text */}
    <div className="w-[80px] flex justify-end">
      <div
        onClick={onClose}
        className="flex items-center cursor-pointer text-[#00ff00]"
      >
        <X size={24} strokeWidth={2} />
      </div>
    </div>
  </div>
);

export const AccountDrawer = forwardRef<DrawerManagerRef, AccountDrawerProps>(({
  children,
  address,
  onClose
}, ref) => {
  const [activeView, setActiveView] = useState<DrawerView>('main');

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    navigateTo: (view: DrawerView) => {
      console.log("Navigating to view:", view);
      setActiveView(view);
    },
    activeView
  }));

  // Map of view titles
  const viewTitles: Record<Exclude<DrawerView, 'main'>, string> = {
    send: 'Send',
    receive: 'Receive',
    history: 'Transactions',
    more: 'More'
  };
  
  const handleBack = () => {
    console.log("Going back to main view");
    setActiveView('main');
  };

  // Render the current view content
  const renderViewContent = () => {
    switch (activeView) {
      case 'send':
        return <AccountSend address={address} />;
      case 'receive':
        return <AccountReceive address={address} />;
      case 'history':
        return <AccountHistory address={address} />;
      case 'more':
        return <AccountMore />;
      default:
        return null;
    }
  };

  console.log("Current active view:", activeView);

  return (
    <div className="relative w-full overflow-hidden flex flex-col mobile-height">
      {/* Common Header */}
      <DrawerHeader
        activeView={activeView}
        onBack={handleBack}
        onClose={onClose}
        viewTitles={viewTitles}
      />

      {/* Views Container */}
      <div className="flex-1 overflow-hidden relative">
        {/* Main View */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out overflow-y-auto",
            activeView !== 'main' ? "-translate-x-full" : "translate-x-0"
          )}
        >
          {children}
        </div>

        {/* Secondary Views */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out overflow-hidden bg-black",
            activeView !== 'main' ? "translate-x-0" : "translate-x-full"
          )}
        >
          {activeView !== 'main' && renderViewContent()}
        </div>
      </div>
    </div>
  );
});

// Export a hook to use in the account view
export const useDrawerNavigation = () => {
  const [activeView, setActiveView] = useState<DrawerView>('main');
  
  const navigateTo = (view: DrawerView) => {
    setActiveView(view);
  };
  
  return { activeView, navigateTo };
}; 
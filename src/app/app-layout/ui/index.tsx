import { FC, useEffect } from "react";
import { Theme } from "@radix-ui/themes";
import { Outlet } from "react-router";
import { Toast } from "@/widgets/toast/ui";

import "@radix-ui/themes/styles.css";
import "@mysten/dapp-kit/dist/index.css";

export const AppLayout: FC = () => {
  useEffect(() => {
    // Function to adjust viewport height for mobile browsers
    const setMobileHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight * 0.01;
      // Set it as a CSS variable
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial call
    setMobileHeight();
    
    // Update on resize and orientation change
    window.addEventListener('resize', setMobileHeight);
    window.addEventListener('orientationchange', setMobileHeight);
    
    return () => {
      window.removeEventListener('resize', setMobileHeight);
      window.removeEventListener('orientationchange', setMobileHeight);
    };
  }, []);

  return (
    <Theme>
      <Toast />
      <div className="w-screen flex flex-col overflow-hidden mobile-height">
        <Outlet />
      </div>
    </Theme>
  );
};

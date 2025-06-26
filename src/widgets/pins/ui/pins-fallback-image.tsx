import React from 'react';

/**
 * Renders a fallback PINS element when no image is available
 */
export const PinsFallbackImage: React.FC = () => {
  return (
    <div className="w-full h-20 bg-[#4CAF50] flex items-center justify-center font-bold text-black pins-fallback-text">
      PINS
    </div>
  );
}; 
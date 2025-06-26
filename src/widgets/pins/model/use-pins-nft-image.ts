import { extractDisplayField } from "@/shared/suipi";

/**
 * Extracts the image URL from a piNS NFT object with consistent fallback handling
 * 
 * @param nft The NFT object from the Sui blockchain
 * @returns An object containing the final image URL and fallback information
 */
export const usePinsNftImage = (nft: any) => {
  if (!nft || !nft.data) {
    return {
      finalImageUrl: '',
      hasImage: false
    };
  }

  const nftData = nft.data;
  const fields = nftData.content?.fields;
  
  // Extract image from display fields
  const imageUrl = extractDisplayField(nft, 'image_url');
  const thumbnailUrl = extractDisplayField(nft, 'thumbnail_url');
  
  // Extract image from content fields if available
  const imageData = fields && 'image' in fields ? String(fields.image) : '';
  const imageFromContent = imageData ? `data:image/svg+xml;base64,${imageData}` : '';
  
  // Use the first available image source
  const finalImageUrl = imageUrl || thumbnailUrl || imageFromContent || '';
  
  return {
    finalImageUrl,
    hasImage: !!finalImageUrl,
    // Additional metadata that might be useful
    imageUrl,
    thumbnailUrl,
    imageFromContent
  };
};

/**
 * Handles image error by replacing with PINS text
 * 
 * @param e The error event from the img tag
 */
export const handlePinsImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  target.onerror = null; // Prevent infinite error loop
  target.style.display = 'none';
  
  // Add green background and PINS text to parent
  if (target.parentElement) {
    target.parentElement.classList.add('bg-[#4CAF50]');
    
    // Create and append PINS text if it doesn't exist yet
    if (!target.parentElement.querySelector('.pins-fallback-text')) {
      const textDiv = document.createElement('div');
      textDiv.className = 'font-bold text-black pins-fallback-text';
      textDiv.innerText = 'PINS';
      target.parentElement.appendChild(textDiv);
    }
  }
}; 
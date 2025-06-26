import { PageContainer } from "@/components/page-container";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { SectionPiOrbit } from "./section-pi-orbit";
import { SectionEcosystem } from "./section-ecosystem";
import { SectionFaq } from "./section-faq";
import { MatrixDivider } from "./matrix-divider";
import { SocialButtons } from "./section-social";

// Add pixel font and animations
const styles = `
  @font-face {
    font-family: 'VT323';
    src: url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
  }

  body, html {
    background-color: #000000 !important;
    margin: 0;
    padding: 0;
    overflow-x: hidden; /* Prevent horizontal scrolling */
    overflow-y: auto; /* Allow vertical scrolling */
    min-height: 100%;
    height: auto;
  }

  /* Custom scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 102, 0.3);
    border-radius: 4px;
    border: 1px solid rgba(0, 255, 102, 0.1);
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 102, 0.5);
  }
  
  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 255, 102, 0.3) rgba(0, 0, 0, 0.7);
  }

  @media (max-width: 768px) {
    /* Mobile styles */
    .title-text {
      font-size: 60px !important;
    }
    
    .subtitle-text {
      font-size: 22px !important;
    }
    
    .tagline-text {
      font-size: 50px !important;
    }
    
    .secondary-text {
      font-size: 20px !important;
    }
    
    .footer-container {
      flex-direction: column !important;
      align-items: center !important;
    }
    
    .donation-section {
      margin-bottom: 20px !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
    }
    
    .address-text {
      font-size: 16px !important;
    }
    
    /* Hide scrollbar on mobile but maintain functionality */
    ::-webkit-scrollbar {
      width: 0px;
      background: transparent;
    }
    
    * {
      scrollbar-width: none;
    }
  }

  @keyframes pixelGlitch {
    0% {
      text-shadow: 0.05em 0 0 rgba(255, 0, 0, .75),
                   -0.025em -0.05em 0 rgba(0, 255, 0, .75),
                   0.025em 0.05em 0 rgba(0, 0, 255, .75);
    }
    14% {
      text-shadow: 0.05em 0 0 rgba(255, 0, 0, .75),
                   -0.05em -0.025em 0 rgba(0, 255, 0, .75),
                   -0.025em 0.05em 0 rgba(0, 0, 255, .75);
    }
    15% {
      text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, .75),
                   0.025em 0.025em 0 rgba(0, 255, 0, .75),
                   -0.05em -0.05em 0 rgba(0, 0, 255, .75);
    }
    49% {
      text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, .75),
                   0.025em 0.025em 0 rgba(0, 255, 0, .75),
                   -0.05em -0.05em 0 rgba(0, 0, 255, .75);
    }
    50% {
      text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, .75),
                   0.05em 0 0 rgba(0, 255, 0, .75),
                   0 -0.05em 0 rgba(0, 0, 255, .75);
    }
    99% {
      text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, .75),
                   0.05em 0 0 rgba(0, 255, 0, .75),
                   0 -0.05em 0 rgba(0, 0, 255, .75);
    }
    100% {
      text-shadow: -0.025em 0 0 rgba(255, 0, 0, .75),
                   -0.025em -0.025em 0 rgba(0, 255, 0, .75),
                   -0.025em -0.05em 0 rgba(0, 0, 255, .75);
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes rotateReverse {
    from {
      transform: rotate(360deg);
    }
    to {
      transform: rotate(0deg);
    }
  }

  @keyframes pulseGlow {
    0% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 0.2;
    }
  }
`;

const OrbitGradients = () => {
  return (
    <>
      {/* Large background gradients */}
      <div style={{
        position: 'fixed',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        animation: 'rotate 180s linear infinite',
        background: 'radial-gradient(circle at center, rgba(0, 255, 0, 0.08) 0%, transparent 50%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        top: '-30%',
        right: '-30%',
        width: '150%',
        height: '150%',
        animation: 'rotateReverse 120s linear infinite',
        background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.06) 0%, transparent 45%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-40%',
        left: '-20%',
        width: '140%',
        height: '140%',
        animation: 'rotate 90s linear infinite',
        background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 40%)',
        zIndex: 0
      }} />
      
      {/* Pure black background instead of gradient overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        zIndex: 1
      }} />
    </>
  );
};

// Copy button component for the footer
const CopyButton = () => {
  const [isCopied, setIsCopied] = useState(false);
  const address = "0x625055fb6216363682effc533db34afc2082f7a55742bca413d2dcf695bc6c9b";

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // Track success state
    let copySuccessful = false;
    
    // Modern clipboard API with fallbacks
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 5000);
        })
        .catch(() => {
          // If clipboard API fails, try alternate methods
          tryAlternateCopyMethods();
        });
    } else {
      // For browsers without clipboard API support
      tryAlternateCopyMethods();
    }
    
    // Fallback copy methods for mobile and older browsers
    function tryAlternateCopyMethods() {
      try {
        // Create temporary input element
        const textarea = document.createElement('textarea');
        textarea.value = address;
        
        // Make the textarea out of viewport
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        
        // Handle iOS specifics
        if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
          textarea.contentEditable = 'true';
          textarea.readOnly = false;
          
          // Select text properly on iOS
          const range = document.createRange();
          range.selectNodeContents(textarea);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            textarea.setSelectionRange(0, address.length);
          }
        } else {
          // For most other devices
          textarea.select();
        }
        
        // Execute copy command
        copySuccessful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (copySuccessful) {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 5000);
        } else {
          console.error('Copy failed using execCommand');
        }
      } catch (err) {
        console.error("Copy fallback failed:", err);
      }
    }
  };

  return (
    <button 
      onClick={handleCopy}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#00ff66",
        padding: "2px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        textShadow: isCopied ? "0 0 8px rgba(0, 255, 0, 0.7)" : "none",
        width: "28px",
        height: "28px"
      }}
      title="Copy address"
    >
      {isCopied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
};

export const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add viewport meta tag for proper mobile display
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(style);
      document.head.removeChild(link);
    };
  }, []);

  const handleOpenWallet = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = 'https://privasui.xyz/chats';
    }, 300);
  };

  return (
    <>
      <PageContainer fullWidth>
        <OrbitGradients />
      
      <div 
        style={{ 
          position: "relative",
            zIndex: 2,
            minHeight: "100vh",
            height: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "1440px",
            margin: "0 auto",
            width: "100%",
            backgroundColor: "#000",
            overflowX: "hidden", /* Prevent horizontal scroll only */
            overflowY: "visible" /* Allow vertical scrolling */
          }}
        >
          {/* Top Navigation */}
        <div style={{
            width: "100%",
          display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "5px 0 10px 0"
          }}>
            {/* <a
              href="https://docs.privasui.xyz/pim"
              target="_blank"
              rel="noopener noreferrer"
              style={{
            color: "rgba(255, 255, 255, 0.8)",
                textDecoration: "none",
                fontFamily: "VT323, monospace",
                fontSize: "18px",
                transition: "all 0.2s ease",
                imageRendering: "pixelated",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#00ff66";
                e.currentTarget.style.textShadow = "0 0 8px rgba(0, 255, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                e.currentTarget.style.textShadow = "none";
              }}
            >
              Discord
            </a>
            <a
              href="https://docs.privasui.xyz/pix"
              target="_blank"
              rel="noopener noreferrer"
            style={{
                color: "rgba(255, 255, 255, 0.8)",
                textDecoration: "none",
                fontFamily: "VT323, monospace",
                fontSize: "18px",
              transition: "all 0.2s ease",
                imageRendering: "pixelated",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = "#00ff66";
                e.currentTarget.style.textShadow = "0 0 8px rgba(0, 255, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                e.currentTarget.style.textShadow = "none";
              }}
            >
              Telegram
            </a> */}
        </div>
        
          {/* Title Section */}
          <div className="w-full flex flex-col items-center" style={{ marginTop: '0' }}>
            <div 
              ref={titleRef}
              className="text-center relative"
              style={{
                transform: 'scale(1)',
                imageRendering: 'pixelated'
              }}
            >
              <h1 
                className="title-text"
                style={{ 
                  fontSize: 'min(96px, max(48px, 12vw))',
                  fontFamily: 'VT323, monospace',
                  fontWeight: 'bold',
                  color: '#00ff66',
                  letterSpacing: '0.1em',
                  animation: 'pixelGlitch 2.5s infinite',
                  textShadow: `
                    0 0 5px #00ff66,
                    0 0 10px #00ff66,
                    0 0 20px #00ff66,
                    0 0 40px #00ff66
                  `,
                  WebkitFontSmoothing: 'none',
                  MozOsxFontSmoothing: 'none',
                  position: 'relative',
                  padding: '0 10px',
                  margin: '0',
                  lineHeight: '1'
                }}
              >
                PRIVASUI
              </h1>
              <p 
                className="subtitle-text"
                style={{ 
                  fontSize: 'min(32px, max(18px, 5vw))',
                  fontFamily: 'VT323, monospace',
                  color: '#ffffff',
                  marginTop: '20px',
                  letterSpacing: '0.1em',
                  textShadow: '0 0 5px #ffffff',
                  WebkitFontSmoothing: 'none',
                  MozOsxFontSmoothing: 'none'
                }}
              >
                WHISPER ACROSS THE SUI BLOCKCHAIN
            </p>
          </div>
          
            {/* Matrix Rain Divider after Whisper text - 32px height */}
            <div style={{ width: '100%', marginTop: '16px', padding: '15px 0' }}>
              <MatrixDivider height={32} />
                </div>

            {/* Add Pi Orbit Section */}
            <div style={{ width: '100%', margin: '0 auto' }}>
              <SectionPiOrbit />
                </div>

            {/* Matrix Rain Divider - 48px height */}
            <div style={{ width: '100%', padding: '15px 0' }}>
              <MatrixDivider height={48} />
                </div>

            {/* Add Ecosystem Section */}
            <div style={{ width: '100%', margin: '0 auto' }}>
              <SectionEcosystem />
        </div>
        
            {/* Matrix Rain Divider before FAQ */}
            <div style={{ width: '100%', padding: '15px 0' }}>
              <MatrixDivider height={32} />
            </div>
            
            {/* Add FAQ Section */}
            <div style={{ width: '100%', margin: '0 auto' }}>
              <SectionFaq />
              </div>
              
            {/* Add Wallet-Chat-More Section */}
            {/* <div style={{ width: '100%', margin: '0 auto' }}>
              <WalletChatMore />
            </div> */}
              </div>
              
          {/* Bottom Section with Button and Social Links */}
          <div className="flex flex-col items-center gap-8" style={{ marginBottom: '5vh' }}>
            {/* Matrix Rain Divider before tagline - 32px height */}
            <div style={{ width: '100%', padding: '15px 0' }}>
              <MatrixDivider height={32} />
            </div>
            
            {/* Tagline */}
            <div style={{
              textAlign: "center",
              marginBottom: "10px"
            }}>
              <p 
                className="tagline-text"
                style={{
                  fontFamily: "VT323, monospace",
                  fontSize: "70px",
                  color: "#00ff66",
                  imageRendering: "pixelated",
                  textShadow: "0 0 5px rgba(0, 255, 102, 0.5)",
                  marginBottom: "5px",
                  fontWeight: "bold",
                  letterSpacing: "2px"
                }}
              >
                Private. Decentralized. Yours.
              </p>
              <p 
                className="secondary-text"
                style={{
                  fontFamily: "VT323, monospace",
                  fontSize: "26px",
                  color: "#00ff66",
                  opacity: "0.8",
                  imageRendering: "pixelated",
                  letterSpacing: "1px"
                }}
              >
                choose 3 with Privasui
              </p>
        </div>
        
            {/* Button */}
            <div style={{
              width: "100%",
              maxWidth: "300px",
              margin: "40px 0"
            }}>
              <a 
                href="https://privasui.xyz/chats"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenWallet();
                }}
                style={{
            width: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  border: "2px solid #00ff66",
                  boxShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
                  padding: "16px",
                  fontSize: "26px",
                  fontWeight: "bold",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontFamily: 'VT323, monospace',
                  imageRendering: 'pixelated',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.7)';
                  e.currentTarget.style.border = '2px solid #00ff66';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
                  e.currentTarget.style.border = '2px solid #00ff66';
                }}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                Open dApp
              </a>
            </div>
            
            {/* Donation Footer */}
            <div style={{
              width: "100%",
              textAlign: "center",
              padding: "30px 20px",
              borderTop: "1px solid rgba(0, 255, 102, 0.2)",
              marginTop: "20px"
            }}>
              <div 
                className="footer-container"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "20px"
                }}
              >
                {/* Left side - Donation */}
                <div 
                  className="donation-section"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "white"
                  }}>              
                    {/* Donate Text */}
                    <span style={{
                      fontFamily: "VT323, monospace",
                      fontSize: "22px",
                      color: "white",
                      imageRendering: "pixelated"
                    }}>
                      Donate Sui:
                    </span>
                  </div>
                  
                  {/* Address with Copy Button */}
              <div style={{
                display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span 
                      className="address-text"
                      style={{
                        fontFamily: "VT323, monospace",
                        fontSize: "18px",
                        color: "#00ff66",
                        imageRendering: "pixelated"
                      }}
                    >
                      0x625055fb6216...f695bc6c9b
                    </span>
                    <CopyButton />
                </div>
                </div>
                
                {/* Right side - Social Icons */}
                <SocialButtons />
              </div>
            </div>
        </div>
      </div>
    </PageContainer>
    </>
  );
}; 
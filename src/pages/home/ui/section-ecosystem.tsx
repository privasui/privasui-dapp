import { useEffect } from 'react';

// Add responsive CSS for mobile ecosystem section
const responsiveStyles = `
  @media (max-width: 1200px) {
    .ecosystem-container {
      justify-content: center;
      padding: 0 10px !important;
    }
    
    .ecosystem-panel {
      min-width: calc(50% - 20px) !important;
      max-width: calc(50% - 20px) !important;
    }
  }
  
  @media (max-width: 768px) {
    .ecosystem-container {
      padding: 0 5px !important;
    }
    
    .ecosystem-panel {
      min-width: calc(100% - 10px) !important;
      max-width: calc(100% - 10px) !important;
      margin-bottom: 15px !important;
      padding: 15px !important;
    }
    
    .button-container {
      padding: 0 !important;
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
    }
    
    .ecosystem-title {
      font-size: 50px !important;
    }
    
    .panel-title {
      font-size: 24px !important;
    }
    
    .panel-subtitle {
      font-size: 16px !important;
    }
  }
`;

// Open button component
const OpenButton = ({ type }: { type?: string }) => {
  // Show Coming Soon for PIX and piNS
  const isComingSoon = type === 'tweet' || type === 'nameservice';
  
  const commonButtonStyle = {
    width: "80%",
    maxWidth: "220px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: isComingSoon ? "#FF9900" : "#00ff66",
    border: `2px solid white`,
    boxShadow: `0 0 10px rgba(255, 255, 255, 0.3)`,
    padding: "12px",
    fontSize: "18px",
    fontWeight: "bold",
    borderRadius: "6px",
    cursor: isComingSoon ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    marginTop: "20px",
    fontFamily: 'VT323, monospace',
    textAlign: "center",
    margin: "20px auto 0",
    textShadow: isComingSoon ? "0 0 5px rgba(255, 153, 0, 0.5)" : "0 0 5px rgba(0, 255, 102, 0.7)"
  } as React.CSSProperties;
  
  if (isComingSoon) {
    return (
      <div style={{...commonButtonStyle, WebkitFontSmoothing: 'none', MozOsxFontSmoothing: 'none'}}>
        Coming Soon
      </div>
    );
  }
  
  return (
    <a 
      href="https://privasui.xyz/chats" 
      target="_blank"
      rel="noopener noreferrer"
      style={{...commonButtonStyle, WebkitFontSmoothing: 'none', MozOsxFontSmoothing: 'none'}}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.border = '2px solid white';
        e.currentTarget.style.textShadow = '0 0 10px rgba(0, 255, 102, 0.9)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        e.currentTarget.style.border = '2px solid white';
        e.currentTarget.style.textShadow = '0 0 5px rgba(0, 255, 102, 0.7)';
      }}
    >
      Open dApp
    </a>
  );
};

export const SectionEcosystem = () => {
  const items = [
    {
      title: 'Web3 Wallet',
      image: '/images/wallet-screen.png',
      subtitle: 'Starting small to support Pi ecosystem we are building secure Web3 wallet.',
      isCustom: false
    },
    {
      title: 'Private E2E Chat',
      image: '/images/chat-screen.png',
      subtitle: 'First private chat on top of Sui blockchain. Till piNS Market launch owning username is the only way to mint piNS names.',
      isCustom: false
    },
    {
      title: 'PIX',
      subtitle: 'Reclaim your voice through on-chain X. No more silencing by moderation.',
      isCustom: true,
      type: 'tweet'
    },
    {
      title: 'piNS & Market',
      subtitle: 'Names under Pi ecosystem are NFTs you can own forever. No more yearly renewals.',
      isCustom: true,
      type: 'nameservice'
    }
  ];
  
  // Add styles to DOM
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = responsiveStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* Main Tagline */}
      <div 
        className="ecosystem-title"
        style={{
          width: '100%',
          textAlign: 'center',
          fontFamily: 'VT323, monospace',
          fontSize: '70px',
          color: 'white',
          marginTop: '20px',
          marginBottom: '20px',
          letterSpacing: '2px',
          imageRendering: 'pixelated',
          textShadow: '0 0 5px rgba(255, 255, 255, 0.7)'
        }}
      >
        Privasui 4 Everyone
      </div>

      {/* Four-Column Layout */}
      <div 
        className="ecosystem-container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'stretch',
          width: '100%',
          maxWidth: '100%', /* Full width */
          margin: '0 auto 60px auto',
          padding: '0 20px',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            className="ecosystem-panel"
            style={{
              flex: '1',
              minWidth: '240px',
              maxWidth: 'calc(25% - 20px)', /* Adjust to 25% for 4 panels per row */
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '10px',
              border: '1px solid rgba(0, 255, 102, 0.2)',
              boxShadow: '0 0 15px rgba(0, 255, 102, 0.1)',
              height: '560px',
              justifyContent: 'flex-start'
            }}
          >
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Image or Custom Component */}
              <div style={{
                width: '100%',
                marginBottom: '30px',
                height: '200px',
                flexShrink: 0
              }}>
                {!item.isCustom ? (
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #00ff66',
                      boxShadow: '0 0 10px rgba(0, 255, 102, 0.5)'
                    }}
                  />
                ) : item.type === 'tweet' ? (
                  // Custom Tweet Component for PIX
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#121212',
                    borderRadius: '8px',
                    border: '2px solid #00ff66',
                    boxShadow: '0 0 10px rgba(0, 255, 102, 0.5)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    {/* Tweet Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        marginRight: '10px',
                        overflow: 'hidden',
                        border: '2px solid #00ff66',
                      }}>
                        <img 
                          src="https://api.dicebear.com/7.x/pixel-art/svg?seed=snowden&backgroundColor=transparent" 
                          alt="Snowden"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            imageRendering: 'pixelated'
                          }}
                        />
                      </div>
                      <div style={{
                        fontFamily: 'VT323, monospace',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>@Snowden</div>
                    </div>
                    
                    {/* Tweet Content */}
                    <div style={{
                      fontFamily: 'VT323, monospace',
                      color: 'white',
                      fontSize: '16px',
                      marginBottom: '10px',
                      flex: 1
                    }}>
                      Privacy is not about something to hide. Privacy is about something to protect. Privacy is about freedom.
                    </div>
                    
                    {/* Tweet Actions */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(0, 255, 102, 0.2)',
                      paddingTop: '8px'
                    }}>
                      <div style={{ color: '#00ff66', fontSize: '14px', fontFamily: 'VT323, monospace' }}>♥ 42</div>
                      <div style={{ color: '#00ff66', fontSize: '14px', fontFamily: 'VT323, monospace' }}>⟳ 7</div>
                      <div style={{ color: '#00ff66', fontSize: '14px', fontFamily: 'VT323, monospace' }}>☰</div>
                    </div>
                  </div>
                ) : (
                  // Custom Nameservice Component for piNS
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#121212',
                    borderRadius: '8px',
                    border: '2px solid #00ff66',
                    boxShadow: '0 0 10px rgba(0, 255, 102, 0.5)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* NFT Domain Card */}
                    <div style={{
                      textAlign: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(0, 255, 102, 0.2)'
                    }}>
                      <div style={{
                        fontFamily: 'VT323, monospace',
                        color: '#00ff66',
                        fontSize: '22px',
                        fontWeight: 'bold',
                        textShadow: '0 0 5px rgba(0, 255, 102, 0.7)'
                      }}>
                        alice.pi
                      </div>
                      <div style={{
                        fontFamily: 'VT323, monospace',
                        color: 'white',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}>
                        NFT Domain #00042
                      </div>
                    </div>
                    
                    {/* Domain Details */}
                    <div style={{
                      marginTop: '10px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'VT323, monospace',
                        color: 'white',
                        fontSize: '14px',
                        marginBottom: '5px'
                      }}>
                        <div>Owner:</div>
                        <div style={{ color: '#00ff66' }}>0xA1i...3Fx</div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'VT323, monospace',
                        color: 'white',
                        fontSize: '14px',
                        marginBottom: '5px'
                      }}>
                        <div>Created:</div>
                        <div>2025-05-21</div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'VT323, monospace',
                        color: 'white',
                        fontSize: '14px'
                      }}>
                        <div>Status:</div>
                        <div style={{ color: '#00ff66' }}>Active</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div style={{
                width: '100%',
                fontFamily: 'VT323, monospace',
                color: 'white',
                imageRendering: 'pixelated',
                fontSize: '28px',
                textAlign: 'center',
                position: 'relative',
                paddingTop: '15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexGrow: 0
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#00ff66',
                  boxShadow: '0 0 10px #00ff66',
                  marginBottom: '15px'
                }}></div>
                <div 
                  className="panel-title"
                  style={{
                    marginTop: '15px'
                  }}
                >
                  {item.title}
                </div>
                {item.subtitle && (
                  <div 
                    className="panel-subtitle"
                    style={{
                      fontSize: '18px',
                      marginTop: '8px',
                      opacity: 0.8,
                      maxWidth: '95%',
                      lineHeight: '1.4',
                      minHeight: '76px'
                    }}
                  >
                    {item.subtitle}
                  </div>
                )}
              </div>
            </div>

            {/* Open Button - Positioned at bottom */}
            <div style={{ 
              width: '100%', 
              padding: '0 10px', 
              marginTop: 'auto',
              flexShrink: 0,
              position: 'relative',
              bottom: '10px'
            }}
            className="button-container"
            >
              <OpenButton type={item.type || 'default'} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

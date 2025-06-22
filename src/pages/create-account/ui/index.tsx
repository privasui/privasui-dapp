// Reviewed
import { useState, useEffect } from "react";
import { Box, Text, Button, Flex, Heading } from "@radix-ui/themes";
import { Copy, Loader2, Check, ArrowLeft } from "lucide-react";
import { generateSeedPhrase, getRawEd25519KeypairFromSeedPhrase } from "@/shared/cryptography";
import { useNavigate } from "react-router";
import { RouteNames } from "@/routes";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { PageContainer } from "@/components/page-container";
import { PrivasuiHeader } from "@/components/header";

export function CreateAccount() {
  const [seedPhrase, setSeedPhrase] = useState<string>("");
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [copyButtonState, setCopyButtonState] = useState<"default" | "copied">("default");
  const [toasts, setToasts] = useState<Array<{ id: number; type: "success" | "error" | "info"; message: string }>>([]);

  const navigate = useNavigate();
  const { addAccount } = useWalletAccountStore();

  // Generate seed phrase on component mount
  useEffect(() => {
    const generateNewSeedPhrase = async () => {
      const newSeedPhrase = await generateSeedPhrase();
      setSeedPhrase(newSeedPhrase);
      setMnemonicWords(newSeedPhrase.split(" "));
    };

    generateNewSeedPhrase();
  }, []);

  // Handle copy seed phrase button
  const handleCopySeedPhrase = async () => {
    let copySuccessful = false;
    
    // First try the Clipboard API (modern browsers)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(seedPhrase);
        copySuccessful = true;
      } catch (err) {
        console.error("Clipboard API failed:", err);
        // Continue to fallback if this fails
      }
    }

    // If Clipboard API failed, try iOS / Safari specific approach
    if (!copySuccessful) {
      try {
        const el = document.createElement('div');
        el.contentEditable = 'true';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        // Need to add to the DOM for iOS
        document.body.appendChild(el);
        
        // Set content and select
        el.innerHTML = seedPhrase;
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Set as non-editable to avoid keyboard
        el.contentEditable = 'false';
        
        // Copy
        copySuccessful = document.execCommand('copy');
        
        // Clean up
        document.body.removeChild(el);
      } catch (err) {
        console.error("iOS-specific approach failed:", err);
        // Continue to next fallback
      }
    }
    
    // If still not successful, try standard fallback
    if (!copySuccessful) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = seedPhrase;
        
        // Make it minimally intrusive
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        textarea.setAttribute('readonly', ''); // Prevents keyboard on some devices
        
        document.body.appendChild(textarea);
        
        // Handle iOS devices specifically
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          textarea.style.fontSize = '16px'; // Prevents zoom on iOS
          textarea.style.backgroundColor = 'transparent';
          
          // iOS requires a more specific selection approach
          const range = document.createRange();
          range.selectNodeContents(textarea);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          textarea.setSelectionRange(0, seedPhrase.length); // For iOS
        } else {
          // For most other devices
          textarea.select();
        }
        
        copySuccessful = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error("Standard fallback failed:", err);
      }
    }
    
    // Handle result - either success or failure
    if (copySuccessful) {
      // Show success state
      setCopyButtonState("copied");
      
    } else {
      // Show error toast if all methods failed
      const toastId = Date.now();
      setToasts(prev => [...prev, { 
        id: toastId, 
        type: "error", 
        message: "Copy failed. Please tap and hold on words to copy manually." 
      }]);
      
      // Remove toast after delay
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
      }, 3000);
    }
    
    // Always reset button state after delay
    setTimeout(() => {
      setCopyButtonState("default");
    }, 5000);
  };

  // Handle create account button
  const handleCreateAccount = async () => {
    setIsCreating(true);
    try {
      const ed25519KeyPair = await getRawEd25519KeypairFromSeedPhrase(seedPhrase);
      await addAccount(ed25519KeyPair);
      navigate(`/${RouteNames.Accounts}`);
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Footer buttons
  const buttonsFooter = (
    <Flex 
      direction="column" 
      gap="3"
      style={{ 
        padding: "20px",
      }}
    >
      <button
        onClick={handleCreateAccount}
        disabled={isCreating}
        style={{
          backgroundColor: "rgba(0, 255, 0, 0.1)",
          color: isCreating ? "rgba(255, 255, 255, 0.5)" : "#00ff00",
          border: "1px solid rgba(0, 255, 0, 0.5)",
          padding: "12px 24px",
          borderRadius: "8px",
          cursor: isCreating ? "not-allowed" : "pointer",
          fontFamily: "monospace",
          fontSize: "16px",
          transition: "all 0.2s ease",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: isCreating ? 0.6 : 1,
          width: "100%",
          height: "48px",
          boxShadow: "0 0 10px rgba(0, 255, 0, 0.2)"
        }}
        onMouseEnter={(e) => {
          if (!isCreating) {
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.2)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
        }}
      >
        {isCreating ? (
          <Flex align="center" gap="2" justify="center">
            <Loader2 size={16} className="animate-spin" />
            <span>Creating...</span>
          </Flex>
        ) : (
          "Create Account"
        )}
      </button>
      
      <button
        onClick={() => navigate(`/${RouteNames.Accounts}`)}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          color: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(0, 255, 0, 0.2)",
          borderRadius: "8px",
          padding: "12px 24px",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: "16px",
          transition: "all 0.2s ease",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          height: "48px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>
    </Flex>
  );
  
  return (
    <PageContainer 
      header={<PrivasuiHeader onClick={() => navigate(`/${RouteNames.Home}`)} />}
      footer={buttonsFooter}
    >
      <Flex direction="column" gap="4" width="100%" style={{ padding: "0" }}>
        {/* Heading */}
        <Heading size="5" style={{ 
          color: "#00ff00", 
          marginBottom: "16px", 
          textAlign: "center",
          fontFamily: "monospace",
          paddingTop: "10px"
        }}>
          Recovery seed phrase
        </Heading>

        {/* Seed phrase display - directly in parent container */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "16px",
            width: "100%",
          }}
        >
          {mnemonicWords.map((word, index) => (
            <Box
              key={index}
              style={{
                padding: "8px",
                backgroundColor: "rgba(0, 255, 0, 0.1)",
                borderRadius: "4px",
                display: "flex",
                fontSize: "0.9rem",
              }}
            >
              <Text
                style={{
                  color: "rgba(0, 255, 0, 0.8)",
                  marginRight: "8px",
                  fontWeight: "bold",
                }}
              >
                {index + 1}.
              </Text>
              <Text style={{ color: "rgba(0, 255, 0, 0.8)", fontSize: "0.95rem" }}>{word}</Text>
            </Box>
          ))}
        </div>
        
        {/* Copy button */}
        <Button
          onClick={handleCopySeedPhrase}
          style={{
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(0, 255, 0, 0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            height: "48px",
            marginBottom: "16px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
          }}
        >
          {copyButtonState === "copied" ? (
            <>
              <Check size={16} color="#00ff00" style={{ marginRight: "6px" }} />
              <Text style={{ color: "#00ff00", fontSize: "14px" }}>
                Copied to clipboard
              </Text>
            </>
          ) : (
            <>
              <Copy size={16} color="#00ff00" style={{ marginRight: "6px" }} />
              <Text style={{ color: "#00ff00", fontSize: "14px" }}>
                Copy Seed Phrase
              </Text>
            </>
          )}
        </Button>

        {/* Warning panel */}
        <Box
          style={{
            backgroundColor: "rgba(255, 70, 70, 0.15)",
            border: "1px solid rgba(255, 70, 70, 0.3)",
            borderRadius: "12px",
            padding: "8px 16px 8px 16px",
            width: "100%",
          }}
        >
          <Text
            style={{
              color: "#ff3333",
              fontSize: "0.9rem",
              textAlign: "justify",
              display: "block",
              marginBottom: "8px",
              lineHeight: "1.4",
            }}
          >
            This phrase is your only way to access your PrivaSui account and messages. Losing it means losing everything — forever.
          </Text>
        </Box>
      </Flex>

      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "350px",
        }}
      >
        {toasts.map((toast, index) => (
          <div
            key={index}
            style={{
              backgroundColor:
                toast.type === "error"
                  ? "rgba(255, 0, 0, 0.2)"
                  : toast.type === "success"
                    ? "rgba(0, 255, 0, 0.2)"
                    : "rgba(0, 0, 0, 0.7)",
              color:
                toast.type === "error"
                  ? "#ff6b6b"
                  : toast.type === "success"
                    ? "#00ff00"
                    : "#ffffff",
              padding: "12px 16px",
              borderRadius: "8px",
              border: `1px solid ${toast.type === "error"
                ? "rgba(255, 0, 0, 0.3)"
                : toast.type === "success"
                  ? "rgba(0, 255, 0, 0.3)"
                  : "rgba(255, 255, 255, 0.1)"
                }`,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              animation: "fadeIn 0.3s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {toast.type === "error" && <div>⚠️</div>}
            {toast.type === "success" && <div>✅</div>}
            {toast.type === "info" && <div>ℹ️</div>}
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

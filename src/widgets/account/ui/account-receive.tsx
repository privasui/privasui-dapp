import React, { useState } from 'react';
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";

interface AccountReceiveProps {
  address: string;
}

export const AccountReceive: React.FC<AccountReceiveProps> = ({ address }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    let copySuccessful = false;

    // Clipboard API (modern browsers)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(address);
        copySuccessful = true;
      } catch (err) {
        // Continue to fallback if this fails
        console.error("Clipboard API failed, falling back to alternatives");
      }
    }

    // iOS / Safari fallback
    if (!copySuccessful) {
      try {
        const el = document.createElement("div");
        el.contentEditable = "true";
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.innerHTML = address;
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        el.contentEditable = "false";
        copySuccessful = document.execCommand("copy");
        document.body.removeChild(el);
      } catch (err) {
        // Continue to next fallback
        console.error("iOS/Safari fallback failed, trying standard fallback");
      }
    }

    // Standard fallback
    if (!copySuccessful) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = address;
        textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
        textarea.setAttribute("readonly", "");
        document.body.appendChild(textarea);
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          textarea.style.fontSize = "16px";
          textarea.style.backgroundColor = "transparent";
          const range = document.createRange();
          range.selectNodeContents(textarea);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          textarea.setSelectionRange(0, address.length);
        } else {
          textarea.select();
        }
        copySuccessful = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (err) {
        // Fallback failed
        console.error("All copy methods failed");
      }
    }

    setCopied(copySuccessful);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full h-full bg-black p-4">
      <div className="flex flex-col items-center w-full gap-6 p-6">
        {/* QR Code with green colors */}
        <div className="bg-black p-4 rounded-lg border border-[#00ff00]/30">
          <QRCodeSVG 
            value={address}
            size={220}
            bgColor="#000000"
            fgColor="#00ff00"
            level="M"
            includeMargin={true}
          />
        </div>

        {/* Address display with copy button */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-white/70 text-sm font-mono text-center">
            Scan this code to get your wallet address
          </p>
          
          <div className="h-8"></div>

          <div className="w-full bg-black/30 border border-[#00ff00]/20 rounded-lg p-3">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className={`flex-1 px-3 py-2 rounded ${copied ? 'bg-[#00ff00]/10' : ''} transition-colors`}>
                <p className="font-mono text-base text-[#00ff00] break-all overflow-hidden">
                  {address}
                </p>
              </div>
              
              <button
                onClick={handleCopyAddress}
                className="p-2 rounded-full hover:bg-[#00ff00]/10 transition-colors flex-shrink-0"
                title={copied ? "Copied!" : "Copy address"}
              >
                {copied ? 
                  <Check size={20} className="text-[#00ff00]" /> : 
                  <Copy size={20} className="text-[#00ff00]" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mobile responsive styles
const responsiveStyles = `
  @media (max-width: 768px) {
    .faq-title {
      font-size: 50px !important;
      margin-bottom: 30px !important;
    }
    
    .faq-question {
      font-size: 18px !important;
    }
    
    .faq-answer {
      font-size: 16px !important;
    }
    
    .faq-links {
      font-size: 16px !important;
    }
    
    .faq-item {
      width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
    
    .faq-question-container {
      padding: 12px 15px !important;
    }
    
    .faq-answer-container {
      padding-left: 10px !important;
      padding-right: 10px !important;
    }
    
    /* Container padding adjustments */
    .faq-container {
      padding: 0 5px !important;
    }
  }
`;

// FAQ Item type
interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

// Component for a single FAQ item with accordion functionality
// @ts-ignore
const FaqAccordionItem = ({ item, index }: { item: FaqItem; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="faq-item" 
      style={{
        marginBottom: '15px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(0, 255, 102, 0.2)',
        transition: 'all 0.3s ease',
        width: '100%'
      }}
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="faq-question-container"
        style={{
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: isOpen ? 'rgba(0, 255, 102, 0.1)' : 'transparent',
          transition: 'background-color 0.3s ease'
        }}
      >
        <h3 
          className="faq-question"
          style={{
            margin: 0,
            fontSize: '20px',
            fontFamily: 'VT323, monospace',
            color: '#00ff66',
            fontWeight: 'normal',
            letterSpacing: '1px',
            imageRendering: 'pixelated',
            flex: 1,
            paddingRight: '10px'
          }}
        >
          {item.question}
        </h3>
        <div 
          style={{
            width: '20px',
            height: '20px',
            position: 'relative',
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
            marginLeft: '10px',
            flexShrink: 0
          }}
        >
          <span 
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: '100%',
              height: '2px',
              backgroundColor: '#00ff66',
              transform: 'translateY(-50%)',
              boxShadow: '0 0 5px rgba(0, 255, 102, 0.7)'
            }}
          />
          <span 
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '2px',
              height: '100%',
              backgroundColor: '#00ff66',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 5px rgba(0, 255, 102, 0.7)'
            }}
          />
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="faq-answer-container"
            style={{
              overflow: 'hidden',
              paddingLeft: '20px',
              paddingRight: '20px'
            }}
          >
            <div 
              className="faq-answer"
              style={{
                padding: '0 0 20px 0',
                color: 'white',
                fontFamily: 'VT323, monospace',
                fontSize: '20px',
                lineHeight: '1.6',
                borderTop: '1px solid rgba(0, 255, 102, 0.1)',
                marginTop: '5px',
                paddingTop: '15px',
                imageRendering: 'pixelated'
              }}
            >
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SectionFaq = () => {
  // Add responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = responsiveStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // FAQ data
  const faqItems: FaqItem[] = [
    {
      question: "Why Privasui? Why another messenger?",
      answer: (
        <div style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', fontSize: '20px', lineHeight: '1.6' }}>
          <p>Privasui stands as the <strong style={{color: '#00ff66'}}>world's first 100% on-chain private messenger</strong>. Unlike Telegram, WhatsApp, or Signal, every aspect of Privasui operates directly on the blockchain.</p>
          
          <p>What makes Privasui revolutionary:</p>
          
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong style={{color: '#00ff66'}}>Fully Transparent:</strong> Both backend (Sui smart contracts) and frontend (Walrus-hosted) are completely auditable by anyone, anywhere, anytime.</li>
            
            <li><strong style={{color: '#00ff66'}}>Truly Decentralized:</strong> No company, server, or individual controls your messages or can shut down the service. Not even Privasui developers can access your encrypted conversations.</li>
            
            <li><strong style={{color: '#00ff66'}}>Censorship Resistant:</strong> Traditional messengers can be blocked by governments or pressured to reveal user data. Privasui exists entirely on the Sui blockchain, making it virtually impossible to censor.</li>
            
            <li><strong style={{color: '#00ff66'}}>Cryptographically Secure:</strong> Every message is secured using the same cryptographic principles that protect billions in cryptocurrency assets.</li>
          </ul>
        </div>
      )
    },
    {
      question: "How are messages stored and encrypted? How secure is it?",
      answer: (
        <div style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', fontSize: '20px', lineHeight: '1.6' }}>
          <p>Privasui implements <strong style={{color: '#00ff66'}}>enterprise-grade encryption</strong> using the same cryptographic foundations that secure billions in Bitcoin and other digital assets.</p>
          
          <p>Our security architecture:</p>
          
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong style={{color: '#00ff66'}}>End-to-end encryption:</strong> Messages are encrypted before leaving your device using ED25519 and X25519 cryptographic protocols—the gold standard in modern cryptography.</li>
            
            <li><strong style={{color: '#00ff66'}}>Zero-knowledge design:</strong> Encryption keys remain exclusively on your device. Not even Privasui developers can decrypt your messages.</li>
            
            <li><strong style={{color: '#00ff66'}}>On-chain storage:</strong> All messages exist as encrypted objects on the Sui blockchain, making them immutable and permanently accessible only to conversation participants.</li>
            
            <li><strong style={{color: '#00ff66'}}>No backdoors:</strong> Unlike traditional messaging apps that may include government access mechanisms, Privasui's open-source design ensures no hidden vulnerabilities exist.</li>
          </ul>
          
          <p>This multi-layered approach creates a communication channel with <strong style={{color: '#00ff66'}}>cryptographic guarantees</strong> of privacy—not just promises or policies that can change at any time.</p>
        </div>
      )
    },
    {
      question: "Who owns messages?  Who can access them?",
      answer: (
        <div style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', fontSize: '20px', lineHeight: '1.6' }}>
          <p><strong style={{color: '#00ff66'}}>You do.</strong> In Privasui, true digital ownership isn't just marketing — it's cryptographically guaranteed by the Sui blockchain.</p>
          
          <p>Message ownership in Privasui:</p>
          
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong style={{color: '#00ff66'}}>Dual-stream architecture:</strong> Every conversation consists of two separate message streams, with each participant having complete sovereignty over their own messages.</li>
            
            <li><strong style={{color: '#00ff66'}}>Blockchain-verified ownership:</strong> Your messages exist as digital assets you control through your encryption keys but not as entries in a company's database.</li>
            
            <li><strong style={{color: '#00ff66'}}>Permanent access rights:</strong> Only conversation participants hold the cryptographic keys needed to decrypt messages, ensuring conversations remain private forever.</li>
            
            <li><strong style={{color: '#00ff66'}}>No corporate access:</strong> Unlike traditional platforms where companies can read, analyze, or monetize your messages, Privasui's architecture makes this technically impossible.</li>
          </ul>
          
          <p>This revolutionary approach transforms digital communication from a service you use into <strong style={{color: '#00ff66'}}>an asset you own</strong>—as fundamental a shift as moving from renting to owning property.</p>
        </div>
      )
    },
    {
      question: "Can my messages be censored or deleted?",
      answer: (
        <div style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', fontSize: '20px', lineHeight: '1.6' }}>
          <p>Since your message streams are on-chain assets that you own, and the content is end-to-end encrypted, <strong style={{color: '#00ff66'}}>censorship is virtually impossible</strong>.
          No central authority can read your messages or prevent them from being delivered. Even Privasui developers cannot access or delete your encrypted messages once they're sent through the system.
          </p>
        </div>
      )
    },
    {
      question: "Do I need a crypto wallet to use Privasui Chat?",
      answer: (
        <div style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', fontSize: '20px', lineHeight: '1.6' }}>
          <p><strong style={{color: '#00ff66'}}>No</strong> — Privasui is itself a fully-featured Web3 wallet. We've built a secure, integrated wallet experience directly into the platform.</p>
          
          <p>Our wallet capabilities:</p>
          
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong style={{color: '#00ff66'}}>Built for the Pi ecosystem:</strong> We've started with essential Sui functionality (send/receive) to support the Pi ecosystem apps.</li>
            
            <li><strong style={{color: '#00ff66'}}>Security-first design:</strong> Your keys remain exclusively on your device with enterprise-grade encryption.</li>
            
            <li><strong style={{color: '#00ff66'}}>Seamless integration:</strong> The wallet functions are naturally woven into the messaging experience.</li>
            
            <li><strong style={{color: '#00ff66'}}>User-friendly:</strong> No blockchain expertise required—we've simplified the complexity without compromising security.</li>
          </ul>
          
          <p>This is just the beginning. Our roadmap includes expanding wallet capabilities while maintaining the same intuitive, user-friendly experience that makes Privasui accessible to everyone.</p>
        </div>
      )
    },
    {
      question: "Is Privasui Chat free to use?",
      answer: (
        <div style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', fontSize: '20px', lineHeight: '1.6' }}>
          <p><strong style={{color: '#00ff66'}}>Yes</strong>, we don't charge for using Privasui Chat. You simply need to have a piNS name which you obtain when creating your profile.
          Like any blockchain application, standard network transaction fees (gas) apply, but these are typically very small by design on the Sui network.
          </p>
        </div>
      )
    }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '60px auto', padding: '0 10px' }} className="faq-container">
      <h2 
        className="faq-title"
        style={{
          textAlign: 'center',
          fontFamily: 'VT323, monospace',
          fontSize: '70px',
          color: 'white',
          marginBottom: '40px',
          letterSpacing: '2px',
          textShadow: '0 0 5px rgba(255, 255, 255, 0.7)',
          imageRendering: 'pixelated'
        }}
      >
        FAQ
      </h2>
      
      <div style={{ padding: '0 5px' }}>
        {faqItems.map((item, index) => (
          <FaqAccordionItem key={index} item={item} index={index} />
        ))}
      </div>
      
      <div 
        style={{
          marginTop: '40px',
          padding: '20px 10px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 255, 102, 0.05)',
          border: '1px solid rgba(0, 255, 102, 0.2)',
          textAlign: 'center'
        }}
      >
        <p 
          className="faq-links"
          style={{
            margin: 0,
            fontFamily: 'VT323, monospace',
            fontSize: '20px',
            color: 'white',
            imageRendering: 'pixelated'
          }}
        >
          Have more questions? <a 
            href="https://discord.gg/privasui" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#00ff66',
              textDecoration: 'none',
              borderBottom: '1px dotted #00ff66'
            }}
          >
            Discord
          </a> | <a 
            href="https://x.com/privasui_xyz" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#00ff66',
              textDecoration: 'none',
              borderBottom: '1px dotted #00ff66'
            }}
          >
            X
          </a> | <a 
            href="https://t.me/PrivasuiCat" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#00ff66',
              textDecoration: 'none',
              borderBottom: '1px dotted #00ff66'
            }}
          >
            Telegram
          </a>
        </p>
      </div>
    </div>
  );
};

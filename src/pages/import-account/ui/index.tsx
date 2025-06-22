import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Flex, Heading } from '@radix-ui/themes';
import { Loader2, ArrowLeft, Import } from 'lucide-react';
import { RouteNames } from '@/routes';
import { getRawEd25519KeypairFromSeedPhrase } from '@/shared/cryptography';
import { useWalletAccountStore } from '@/widgets/profile/model/use-wallet-accounts';
import { PageContainer } from '@/components/page-container';
import { PrivasuiHeader } from '@/components/header';

export function ImportAccount() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const { addAccount } = useWalletAccountStore();
  const navigate = useNavigate();

  const handleImportAccount = async () => {
    if (!seedPhrase.trim()) {
      setError('Please enter your seed phrase');
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      const ed25519KeyPair = await getRawEd25519KeypairFromSeedPhrase(seedPhrase);
      await addAccount(ed25519KeyPair);
      navigate(`/${RouteNames.Accounts}`);
    } catch (err) {
      console.error('Error unlocking profile:', err);
      setError('An error occurred while unlocking your profile');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleBack = () => {
    navigate(`/${RouteNames.Accounts}`);
  };

  // Footer buttons
  const buttonsFooter = (
    <Flex direction="column" gap="3" style={{ padding: "16px" }}>
      <button
        onClick={handleImportAccount}
        disabled={isUnlocking || !seedPhrase.trim()}
        style={{
          backgroundColor: "rgba(0, 255, 0, 0.1)",
          color: "#00ff00",
          border: "1px solid rgba(0, 255, 0, 0.5)",
          padding: "12px 24px",
          borderRadius: "8px",
          cursor: seedPhrase.trim() && !isUnlocking ? "pointer" : "not-allowed",
          fontFamily: "monospace",
          fontSize: "16px",
          transition: "all 0.2s ease",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          opacity: seedPhrase.trim() && !isUnlocking ? 1 : 0.6,
          width: "100%",
          height: "48px",
          boxShadow: "0 0 10px rgba(0, 255, 0, 0.2)",
        }}
        onMouseEnter={(e) => {
          if (seedPhrase.trim() && !isUnlocking) {
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.2)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
        }}
      >
        {isUnlocking ? (
          <Flex align="center" gap="2" justify="center">
            <Loader2 size={16} className="animate-spin" />
            <span>Importing...</span>
          </Flex>
        ) : (
          <>
            <Import size={16} />
            Import Account
          </>
        )}
      </button>
      
      <button
        onClick={handleBack}
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
      header = { 
        <PrivasuiHeader onClick={() => navigate(`/${RouteNames.Home}`)} />
      }
      footer={buttonsFooter}
    >
      <div style={{
        display: "flex",
        flexDirection: "column",
        padding: "10px 0",
        height: "100%",
        width: "100%",
      }}>
        <Heading 
          size="4" 
          style={{ 
            color: "#00ff00", 
            marginBottom: "16px", 
            textAlign: "center",
            fontFamily: "monospace"
          }}
        >
          Import new account
        </Heading>
          
        <textarea
          placeholder="Enter your Privasui profile's 12-word seed phrase to unlock"
          value={seedPhrase}
          onChange={(e) => setSeedPhrase(e.target.value)}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(0, 255, 0, 0.5)',
            color: '#FFFFFF',
            padding: '16px',
            borderRadius: '8px',
            width: '100%',
            flex: '1',
            minHeight: '150px',
            maxHeight: '250px',
            marginBottom: '16px',
            resize: 'none',
            fontSize: '16px',
            fontFamily: 'monospace',
            outline: 'none',
            boxShadow: '0 0 8px rgba(0, 255, 0, 0.2)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 255, 0, 0.8)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 255, 0, 0.5)';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.2)';
          }}
        />

        {error && (
          <div style={{ 
            color: '#ff4d4d', 
            marginBottom: '8px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
      </div>
    </PageContainer>
  );
} 
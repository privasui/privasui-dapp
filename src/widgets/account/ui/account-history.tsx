import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ExternalLink, Code } from "lucide-react";
import { useSuiClient } from "@mysten/dapp-kit";
import { LoadingSpinner } from "@/components/loading-spinner";
import { isDevnet, isMainnet, isTestnet } from "@/shared/network-config";

interface AccountHistoryProps {
  address: string;
}

interface TransactionData {
  id: string;
  type: 'send' | 'receive' | 'move_call';
  amount?: string;
  timestamp: number;
  fromAddress: string;
  toAddress: string;
  status: 'success' | 'failure' | 'unknown';
  moveData?: {
    package: string;
    module: string;
    function: string;
  };
  errorMessage?: string;
}

const ITEMS_PER_PAGE = 10;

export const AccountHistory: React.FC<AccountHistoryProps> = ({ address }) => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const suiClient = useSuiClient();

  // Get SuiVision URL based on network
  const getSuiVisionUrl = (txDigest: string) => {
    let networkPrefix; // Default fallback
    
    if (isDevnet()) {
      networkPrefix = "devnet";
    } else if (isTestnet()) {
      networkPrefix = "testnet";
    } else if (isMainnet()) {
      networkPrefix = "";
    }
    
    return `https://${networkPrefix ? networkPrefix + '.' : ''}suivision.xyz/txblock/${txDigest}`;
  };

  const fetchTransactions = async (nextCursor: string | null = null) => {
    try {
      if (!nextCursor) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      // First try to get transactions from address directly
      const txsSent = await suiClient.queryTransactionBlocks({
        filter: {
          FromAddress: address
        },
        options: {
          showEffects: true,
          showInput: true,
          showBalanceChanges: true,
        },
        limit: ITEMS_PER_PAGE,
        cursor: nextCursor || undefined,
      });

    //   console.log("Transactions found:", txsSent.data.length);

      // Check if there are more transactions to load
      setHasMore(txsSent.hasNextPage);
      setCursor(txsSent.nextCursor || null);
      
      // Sort by timestamp descending
      txsSent.data.sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs));
      
      const processedTxs = await Promise.all(txsSent.data.map(async (tx) => {
        // Get detailed transaction info
        const txDetails = await suiClient.getTransactionBlock({
          digest: tx.digest,
          options: {
            showEffects: true,
            showInput: true,
            showBalanceChanges: true,
          },
        });

        // console.log(`Transaction ${tx.digest} details:`, txDetails);
        
        // Check if this is a Move call using a more generic approach
        const txData = txDetails.transaction?.data;
        const txKind = txData?.transaction?.kind;
        const isMoveTx = txKind === 'ProgrammableTransaction';
        
        if (isMoveTx) {
        //   console.log(`Transaction ${tx.digest} is a Move call`);
          
          // Use a more generic approach to access transaction data
          try {
            // @ts-ignore - Access potential programmable transactions data
            const txContent = txData?.transaction;
            if (txContent && typeof txContent === 'object') {
            //   console.log(`Transaction ${tx.digest} content:`, txContent);
            }
          } catch (err) {
            // console.log(`Error accessing move call data:`, err);
          }
        }

        // Log transaction status
        // console.log(`Transaction ${tx.digest} status:`, txDetails.effects?.status);
        
        // Check for error status and capture the error message
        let errorMessage = null;
        if (txDetails.effects?.status?.status === 'failure') {
          errorMessage = txDetails.effects.status.error;
        //   console.log(`Transaction ${tx.digest} failed with error: ${errorMessage}`);
        }

        // Default to send since we're filtering on FromAddress
        let txType: 'send' | 'receive' | 'move_call' = 'send';
        let amount: string | undefined;
        let recipient = '';
        let moveData: { package: string; module: string; function: string } | undefined;
        
        try {
          // Check if this is a Move call with function other than simple transfer
          if (isMoveTx) {
            try {
              // Add proper null check for transaction data
              if (txDetails.transaction?.data) {
                const txInputs = JSON.stringify(txDetails.transaction.data);
                const txRawData = JSON.parse(txInputs);
                
                if (txRawData && txRawData.transaction) {
                  const transactions = txRawData.transaction.transactions;
                  if (transactions && Array.isArray(transactions)) {
                    // Look for MoveCall or TransferObjects type transactions
                    for (const t of transactions) {
                      if (t && typeof t === 'object') {
                        // Check for MoveCall
                        if ('MoveCall' in t) {
                          // It's a Move call, not a regular transfer
                          txType = 'move_call';
                          moveData = {
                            package: t.MoveCall.package,
                            module: t.MoveCall.module,
                            function: t.MoveCall.function
                          };
                          
                          // Check for simple transfers
                          const isTransfer = 
                            (t.MoveCall.function === 'transfer' || 
                             t.MoveCall.function === 'send' || 
                             t.MoveCall.function === 'send_sui');
                             
                          // For transfers, we'll keep it as a "send" type
                          if (isTransfer) {
                            txType = 'send';
                          }
                          
                          break;
                        }
                        // Check for TransferObjects
                        else if ('TransferObjects' in t) {
                          // This is a direct transfer with recipient in Input
                          txType = 'send';
                          
                          // Find recipient address from inputs
                          const recipientIndex = t.TransferObjects[1]?.Input;
                          if (recipientIndex !== undefined) {
                            // Get the input at this index
                            const inputs = txRawData.transaction.inputs;
                            if (inputs && inputs[recipientIndex] && 
                                inputs[recipientIndex].type === 'pure' && 
                                inputs[recipientIndex].valueType === 'address') {
                              recipient = inputs[recipientIndex].value;
                            //   console.log(`Found recipient address from TransferObjects: ${recipient}`);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.log(`Error parsing move call data:`, err);
            }
          }
          
          // Try to extract amount from balance changes
          if (txDetails.balanceChanges) {
            // console.log(`Transaction ${tx.digest} balance changes:`, txDetails.balanceChanges);
            
            for (const change of txDetails.balanceChanges) {
              // Check if this is a SUI change for our address
              const ownerAddress = typeof change.owner === 'object' && 'AddressOwner' in change.owner 
                ? change.owner.AddressOwner 
                : null;
                
              if (ownerAddress === address && change.coinType === '0x2::sui::SUI') {
                const changeAmount = Number(change.amount);
                // Negative amount means tokens were sent
                if (changeAmount < 0) {
                  amount = (Math.abs(changeAmount) / 1000000000).toFixed(4);
                  break;
                }
              }
            }
            
            // Try to find recipient (someone who received positive balance change)
            for (const change of txDetails.balanceChanges) {
              const ownerAddress = typeof change.owner === 'object' && 'AddressOwner' in change.owner 
                ? change.owner.AddressOwner 
                : null;
                
              if (ownerAddress && ownerAddress !== address && 
                  change.coinType === '0x2::sui::SUI' && 
                  Number(change.amount) > 0) {
                recipient = ownerAddress;
                break;
              }
            }
          }
          
          // For failed transactions or if we couldn't find the recipient in balance changes,
          // try to extract recipient from transaction input
          if (!recipient && txDetails.transaction?.data) {
            try {
            //   console.log(`Transaction ${tx.digest} input data:`, JSON.stringify(txDetails.transaction.data));
              
              // Try to find recipients in the raw transaction data
              const txInputs = JSON.stringify(txDetails.transaction.data);
              const recipientMatch = txInputs.match(/"address":"(0x[a-fA-F0-9]+)"/);
              
              // Check for Move call transactions
              if (isMoveTx) {
                try {
                  // Use a safer approach to extract move call data
                  const txRawData = JSON.parse(txInputs);
                  if (txRawData && txRawData.transaction) {
                    // console.log(`Move call raw data for ${tx.digest}:`, txRawData.transaction);
                    
                    // Look for transactions array if it exists
                    const transactions = txRawData.transaction.transactions;
                    if (transactions && Array.isArray(transactions)) {
                      // Look for MoveCall type transactions
                      for (const t of transactions) {
                        if (t && typeof t === 'object' && 'MoveCall' in t) {
                        //   console.log(`Move call found in ${tx.digest}:`, t.MoveCall);
                          
                          // Extract more info about the move call
                          const moveCall = t.MoveCall;
                        //   console.log(`Move call package:`, moveCall.package);
                        //   console.log(`Move call module:`, moveCall.module);
                        //   console.log(`Move call function:`, moveCall.function);
                          
                          // Try to get the target/recipient if available
                          if (moveCall.arguments && Array.isArray(moveCall.arguments)) {
                            // console.log(`Move call arguments:`, moveCall.arguments);
                          }
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.log(`Error parsing move call data:`, err);
                }
              }
              
              if (recipientMatch && recipientMatch[1] && recipientMatch[1] !== address) {
                recipient = recipientMatch[1];
                // console.log(`Found recipient in transaction data: ${recipient}`);
              }
            } catch (err) {
              console.log('Error parsing transaction inputs:', err);
            }
          }
          
          // If amount is still not set for a failed transaction, use a placeholder
          if (txDetails.effects?.status?.status === 'failure' && !amount) {
            amount = '0.0010'; // Common amount for failed transactions due to gas fees
          }
        } catch (err) {
          console.log('Error parsing transaction details:', err);
        }

        return {
          id: tx.digest,
          type: txType,
          amount: amount,
          timestamp: Number(tx.timestampMs),
          fromAddress: address,
          toAddress: recipient || 'Unknown Recipient',
          status: txDetails.effects?.status?.status || 'unknown',
          moveData: moveData,
          errorMessage: errorMessage
        } as TransactionData;
      }));

      // Update transactions, appending new ones if we're loading more
      setTransactions(prev => 
        nextCursor ? [...prev, ...processedTxs] : processedTxs
      );
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loadMoreRef.current && hasMore) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoadingMore && !isLoading) {
            loadMore();
          }
        },
        { threshold: 0.5 }
      );
      
      observerRef.current.observe(loadMoreRef.current);
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [hasMore, isLoadingMore, isLoading, transactions]);

  // Initial load
  useEffect(() => {
    fetchTransactions();

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [address]);

  const loadMore = () => {
    if (cursor && hasMore && !isLoadingMore) {
      fetchTransactions(cursor);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.includes('Unknown')) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-[#ff4d4d]">
        <span className="font-mono text-sm">{error}</span>
        <button 
          onClick={() => fetchTransactions()}
          className="mt-4 px-4 py-2 bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/30 rounded-lg hover:bg-[#00ff00]/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-black pt-8 pb-8">
      <div className="flex-1 h-full w-full">
        {transactions.length > 0 ? (
          <div className="h-full w-full flex flex-col">
            <div className="flex-1 overflow-y-auto bg-black  rounded-lg">
              {transactions.map((tx, _index) => (
                <div key={tx.id} className="border-b border-[#00ff00]/10 last:border-b-0">
                  <div className="w-full flex items-center justify-between p-4 bg-black hover:bg-[#00ff00]/5 transition-colors">
                    <div className="flex flex-row gap-3 items-center">
                      {/* Transaction Icon - always green */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.status === 'failure' ? 'bg-red-500/20' : 'bg-[#00ff00]/20'}`}>
                        {tx.type === 'receive' 
                          ? <ArrowDown size={20} className={tx.status === 'failure' ? 'text-red-500' : 'text-[#00ff00]'} /> 
                          : tx.type === 'move_call'
                          ? <Code size={20} className={tx.status === 'failure' ? 'text-red-500' : 'text-[#00ff00]'} />
                          : <ArrowUp size={20} className={tx.status === 'failure' ? 'text-red-500' : 'text-[#00ff00]'} />
                        }
                      </div>
                      
                      {/* Transaction Info */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {tx.type === 'receive' 
                              ? 'Received SUI' 
                              : tx.type === 'move_call'
                              ? `${tx.moveData?.module || 'Contract'}.${tx.moveData?.function || 'call'}`
                              : 'Sent SUI'}
                          </span>
                          {/* Only show failure tag */}
                          {tx.status === 'failure' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                              failed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatTimeAgo(tx.timestamp)}</span>
                          <span>•</span>
                          {tx.status === 'failure' ? (
                            <span title={tx.errorMessage} className="text-red-400">
                              {tx.errorMessage 
                                ? `${tx.errorMessage.slice(0, 20)}${tx.errorMessage.length > 20 ? '...' : ''}`
                                : 'Transaction failed'}
                            </span>
                          ) : tx.type === 'move_call' ? (
                            <span>
                              {tx.moveData?.package 
                                ? `Package: ${tx.moveData.package.slice(0, 8)}...`
                                : 'Smart contract call'}
                            </span>
                          ) : (
                            <span>
                              {tx.type === 'send' 
                                ? (tx.toAddress && tx.toAddress !== 'Unknown Recipient' 
                                   ? `To: ${formatAddress(tx.toAddress)}` 
                                   : 'To: Unknown')
                                : `From: ${formatAddress(tx.fromAddress)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Link - white text for amount */}
                    <div className="flex flex-col items-end gap-1">
                      {tx.amount && (
                        <span className={`text-sm font-bold ${tx.status === 'failure' ? 'text-red-400 line-through' : 'text-white'}`}>
                          {tx.type === 'receive' ? '+' : '-'}{tx.amount} SUI
                        </span>
                      )}
                      
                      <a
                        href={getSuiVisionUrl(tx.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#00ff00] hover:text-[#00ff00]/80 transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>SuiVision</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load more indicator */}
              {hasMore && (
                <div 
                  ref={loadMoreRef} 
                  className="w-full p-4 flex justify-center items-center border-t border-[#00ff00]/10"
                >
                  {isLoadingMore ? (
                    <LoadingSpinner />
                  ) : (
                    <span className="text-xs text-[#00ff00]/70">Scroll for more</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-white/50 bg-black border border-[#00ff00]/30 rounded-lg h-full">
            <Code size={48} className="mb-4 text-[#00ff00] opacity-70" />
            <span className="font-mono text-lg text-[#00ff00]">No transaction history</span>
          </div>
        )}
      </div>
    </div>
  );
};

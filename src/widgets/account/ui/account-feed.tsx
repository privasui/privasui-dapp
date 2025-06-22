import React, { useRef, useState } from 'react';

interface FeedMessage {
  id: string;
  content: string;
  timestamp: Date;
  author: string;
  authorAddress: string;
  likes?: number;
  reposts?: number;
  replies?: number;
  hasLiked?: boolean;
}

// Mock data for the feed
const MOCK_MESSAGES: FeedMessage[] = [
  {
    id: '1',
    content: 'Just minted my first NFT on Sui! 🎨 The gas fees are amazing! #SuiNetwork #NFT',
    timestamp: new Date('2024-03-20T10:30:00'),
    author: 'Sui Enthusiast',
    authorAddress: '0x1234...5678',
    likes: 42,
    reposts: 12,
    replies: 5
  },
  {
    id: '2',
    content: 'Loving the speed of Sui transactions! ⚡ Anyone else impressed by the TPS?',
    timestamp: new Date('2024-03-20T09:15:00'),
    author: 'Crypto Dev',
    authorAddress: '0x8765...4321',
    likes: 89,
    reposts: 34,
    replies: 15
  },
  {
    id: '3',
    content: 'Check out my new collection on Sui! 🚀 The ecosystem is growing fast.',
    timestamp: new Date('2024-03-19T18:45:00'),
    author: 'NFT Creator',
    authorAddress: '0x9876...5432',
    likes: 156,
    reposts: 45,
    replies: 23,
  },
  {
    id: '4',
    content: 'Just deployed my first smart contract on Sui. The developer experience is fantastic! 💻 #SuiDev',
    timestamp: new Date('2024-03-19T15:20:00'),
    author: 'Blockchain Builder',
    authorAddress: '0x3456...7890',
    likes: 234,
    reposts: 67,
    replies: 31,
  },
  {
    id: '5',
    content: 'Participated in my first Sui governance vote today. Love being part of this community! 🗳️',
    timestamp: new Date('2024-03-19T12:10:00'),
    author: 'Sui Governance',
    authorAddress: '0x2345...6789',
    likes: 178,
    reposts: 56,
    replies: 28,
  },
  {
    id: '6',
    content: 'The new Sui Move updates are game-changing! Check out these performance improvements 📈',
    timestamp: new Date('2024-03-19T11:05:00'),
    author: 'Move Developer',
    authorAddress: '0x5678...1234',
    likes: 312,
    reposts: 89,
    replies: 45,
  },
  {
    id: '7',
    content: 'Building a new DeFi protocol on Sui. The composability is incredible! 🏗️ #SuiDeFi',
    timestamp: new Date('2024-03-19T10:30:00'),
    author: 'DeFi Builder',
    authorAddress: '0x8901...2345',
    likes: 267,
    reposts: 78,
    replies: 42,
  },
  {
    id: '8',
    content: 'Just discovered how easy it is to integrate Sui wallet. Documentation is top-notch! 📚',
    timestamp: new Date('2024-03-19T09:15:00'),
    author: 'Wallet Dev',
    authorAddress: '0x3456...7890',
    likes: 145,
    reposts: 34,
    replies: 19,
  },
  {
    id: '9',
    content: 'The Sui community is amazing! Thanks everyone for the help with my first dApp 🙏',
    timestamp: new Date('2024-03-19T08:20:00'),
    author: 'dApp Developer',
    authorAddress: '0x6789...0123',
    likes: 198,
    reposts: 45,
    replies: 27,
  },
  {
    id: '10',
    content: "Exploring Sui's object model. This is revolutionary for blockchain state management! 🔍",
    timestamp: new Date('2024-03-19T07:45:00'),
    author: 'Blockchain Researcher',
    authorAddress: '0x9012...3456',
    likes: 276,
    reposts: 89,
    replies: 54,
  },
  {
    id: '11',
    content: 'Just launched our gaming marketplace on Sui. The throughput is incredible! 🎮 #SuiGaming',
    timestamp: new Date('2024-03-19T06:30:00'),
    author: 'Game Dev',
    authorAddress: '0x4567...8901',
    likes: 423,
    reposts: 156,
    replies: 87,
  },
  {
    id: '12',
    content: 'Working on a new privacy feature for Sui dApps. Stay tuned! 🔒 #Privacy #Web3',
    timestamp: new Date('2024-03-19T05:15:00'),
    author: 'Privacy Engineer',
    authorAddress: '0x7890...1234',
    likes: 345,
    reposts: 123,
    replies: 65,
  }
];

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

interface AccountFeedProps {
  address?: string;
}

export const AccountFeed: React.FC<AccountFeedProps> = (_props: AccountFeedProps) => {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [loading, setLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);

  // Simulate loading more messages
  const loadMoreMessages = () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      // For demo, just duplicate some messages with new IDs
      const newMessages = messages.slice(0, 5).map(msg => ({
        ...msg,
        id: 'new-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7), // Random time in last 7 days
      }));
      
      setMessages(prev => [...prev, ...newMessages]);
      setLoading(false);
      // For demo, limit the total number of messages
      if (messages.length > 30) setHasMore(false);
    }, 1000);
  };

  // Handle scroll
  const handleScroll = () => {
    if (!feedRef.current || loading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMoreMessages();
    }
  };

  // Toggle like
  const handleLike = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          hasLiked: !msg.hasLiked,
          likes: (msg.likes || 0) + (msg.hasLiked ? -1 : 1)
        };
      }
      return msg;
    }));
  };

  return (
    <div 
      ref={feedRef}
      className="w-full flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(100vh-400px)] scroll-smooth"
      onScroll={handleScroll}
      style={{ marginBottom: '60px' }}
    >
      {messages.map((message) => (
        <div 
          key={message.id}
          className="w-full flex flex-col gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            {/* Author Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {message.author.charAt(0)}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{message.author}</span>
                <span className="text-sm text-gray-500">
                  {message.authorAddress}
                </span>
                <span className="text-sm text-gray-400">·</span>
                <span className="text-sm text-gray-500">{formatTimeAgo(message.timestamp)}</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-800 ml-13">{message.content}</p>
          
          {/* Interaction buttons */}
          <div className="flex gap-6 mt-2 ml-13">
            <button className="text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">{message.replies || 0}</span>
            </button>
            <button className="text-gray-500 hover:text-green-500 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">{message.reposts || 0}</span>
            </button>
            <button 
              className={`${message.hasLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors flex items-center gap-1`}
              onClick={() => handleLike(message.id)}
            >
              <svg className="w-4 h-4" fill={message.hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{message.likes || 0}</span>
            </button>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {!hasMore && (
        <div className="text-center text-gray-500 py-4">
          No more messages to load
        </div>
      )}
    </div>
  );
};

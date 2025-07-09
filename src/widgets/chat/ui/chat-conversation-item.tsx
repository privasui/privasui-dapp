// src/widgets/chat/ui/chat-conversation-item.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader } from 'lucide-react';
import { useSuiClient } from '@mysten/dapp-kit';
import { fetchStreamById, ProfileInfo } from '@/shared/suipi';
import { useProfilesStore } from '@/widgets/profile/model/use-profile-store';
import { useConversationTracking } from '../model/use-conversation-tracking';
import { fetchUserProfileInfo } from '@/shared/suipi';

interface ChatConversationItemProps {
  owner: string;
  pair: string;
  ownerStreamId: string,
  pairStreamId: string;
}

export const ChatConversationItem: React.FC<ChatConversationItemProps> = ({ owner, pair, pairStreamId, ownerStreamId }) => {
  const suiClient= useSuiClient();
  const { markConversationAsRead, getConversationReadState, calculateUnreadCount } = useConversationTracking();
  const { addProfile, getProfile } = useProfilesStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [pairUsername, setPairUsername] = useState<string | null>(null);
  const [avatarSvgUrl, setAvatarSvgUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isSavedMessages = owner === pair;
  
  const navigate = useNavigate();

  // Helper function to update unread count
  const updateUnreadCount = async () => {
    try {
      // Fetch stream data to get unread count
      const pairStream = await fetchStreamById(suiClient as any, pairStreamId);
      if (!pairStream) return;
      
      const conversationReadState = getConversationReadState(owner, pair);
      if (!conversationReadState) {
        await markConversationAsRead(owner, pair, Number(pairStream.next_id));
      } else {
        const unreadMessageCount = calculateUnreadCount(owner, pair, Number(pairStream.next_id));
        if (unreadMessageCount > 0) {
          setUnreadCount(unreadMessageCount);
        }
      }
    } catch (error) {
      console.error("Error updating unread counts:", error);
    }
  };

  useEffect(() => {
    const fetchPairData = async () => {
      try {
       
        // First check if we already have this profile in the store
        const storedProfile = getProfile(pair);
        console.log("🔍 [ChatConversationItem] storedProfile:", storedProfile);
        
        if (storedProfile) {
          // Use stored profile data
          setPairUsername(storedProfile.name || null);
          setAvatarSvgUrl(storedProfile.avatarSvgUrl || null);
          
          // Update unread counts
          await updateUnreadCount();
          console.log("Loaded profile from store");
          return;
        }

        // If not in store, fetch from blockchain
        setIsLoading(true);
        
        let recipientProfile: ProfileInfo | null = await fetchUserProfileInfo(suiClient as any, pair);

        console.log("🔍 [ChatConversationItem] recipientProfile:", recipientProfile);
    
        if (!recipientProfile) {
          setIsLoading(false);
          return;
        }

        // TODO::AVAR: we need to get the name from the profile 
        setPairUsername(recipientProfile.name);

        // read avatar data from the avatar_id

        if (recipientProfile.avatar) {          
          // Create data URL
          const svgUrl = `data:image/svg+xml;base64,${recipientProfile.avatar.image}`;
          setAvatarSvgUrl(svgUrl);

          // Store in global cache
          addProfile(pair, {
            name: recipientProfile.name,
            avatarSvgUrl: svgUrl,
          });
          
          // Update unread counts
          await updateUnreadCount();
        }
      } catch (error) {
        console.error("Error fetching pair data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPairData();
  }, []);

  // Helper function to render avatar
  const renderAvatar = () => {
    if (avatarSvgUrl) {
      return (
        <div style={{ 
          width: 36, 
          height: 36, 
          marginRight: "12px", 
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: "rgba(0, 255, 0, 0.1)"
        }}>
          <img 
            src={avatarSvgUrl} 
            alt={`${pairUsername || pair}'s avatar`}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      );
    }
    
    // Fallback to showing the first letter as avatar
    return (
      <div style={{ 
        width: 36, 
        height: 36, 
        marginRight: "12px", 
        borderRadius: "50%", 
        backgroundColor: "rgba(0, 255, 0, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#00ff00",
        fontSize: "12px",
        fontWeight: "bold"
      }}>
        {(pairUsername || pair).charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div
        key={`${ownerStreamId}-${pairStreamId}`}
        onClick={() => navigate(`/pim/${pair}`)}
        style={{
          display: "flex",
          alignItems: "center",
          height: "64px",
          width: "100%",
          borderBottom: "1px solid rgba(0, 255, 0, 0.2)",
          padding: "0 16px",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
        }}
    >
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          flex: 1,
        }}>
          {isLoading ? (
            <div style={{ 
              width: 36, 
              height: 36, 
              marginRight: "12px", 
              borderRadius: "50%",
              backgroundColor: "rgba(0, 255, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Loader size={18} color="#00ff00" className="animate-spin" />
            </div>
          ) : renderAvatar()}

          <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
          }}>
            <span style={{
                color: "#00ff00",
                fontFamily: "monospace",
                fontSize: "16px",
            }}>
                {pairUsername}
            </span>
            <span style={{
                color: "rgba(0, 255, 0, 0.7)",
                fontFamily: "monospace",
                fontSize: "12px",
            }}>
                {isSavedMessages ? "My Saved Messages" : `${pair.slice(0, 6)}...${pair.slice(-4)}`}
            </span>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <div style={{
            backgroundColor: "#00ff00",
            color: "#000000",
            borderRadius: "9999px",
            padding: "2px 8px",
            fontSize: "12px",
            fontWeight: "bold",
            minWidth: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
    </div>
  );
};



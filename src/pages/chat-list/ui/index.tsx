import { PageContainer } from "@/components/page-container";
import { PrivasuiHeader } from "@/components/header";
import { AccountButton } from "@/widgets/account/ui/account-button";
import { ChatList } from "@/widgets/chat/ui/chat-list";
import { useNavigate } from "react-router";
import { RouteNames } from "@/routes";
import { MessageSquare } from "lucide-react";

export const ChatListPage = () => {
  const navigate = useNavigate();
  return (
    <PageContainer
      header={
        <PrivasuiHeader 
          onClick={() => navigate(`/${RouteNames.Home}`)}
          title={
            <>
              <MessageSquare size={20} className="text-primary" />
              <span>Privasui / piM</span>
            </>
          }
        >
          <AccountButton />
        </PrivasuiHeader>
      }
    >
      <ChatList />
    </PageContainer>
  );
};

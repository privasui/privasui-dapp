import { AccountButton } from "@/widgets/account/ui/account-button";
import { Box, Flex, Heading } from "@radix-ui/themes";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useNavigate } from "react-router";
import { RouteNames } from "@/routes";

export const ChatListHeader = () => {
  const { activeAccount } = useWalletAccountStore();
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate(`/${RouteNames.Home}`);
  };

  return (
    <Box
      style={{
        width: "100%",
        top: 0,
      }}
    >
      <Flex
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "start",
            flexDirection: "column",
          }}
        >
          <Heading
            onClick={handleTitleClick}
            style={{
              color: "#00ff00",
              fontFamily: "monospace",
              fontSize: "18px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "300px",
              marginBottom: "2px",
              cursor: "pointer",
              transition: "text-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textShadow = "0 0 8px rgba(0, 255, 0, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textShadow = "none";
            }}
          >
            Privasui
          </Heading>
        </Box>
        <Box
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {activeAccount && <AccountButton />}
        </Box>
      </Flex>
    </Box>
  );
};

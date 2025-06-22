import { Outlet } from "react-router";
import { PageContainer } from "@/components/page-container";
import { PrivasuiHeader } from "@/components/header";
import { AccountListFooter } from "../../../widgets/account/ui/account-list-footer";
import { AccountList } from "@/widgets/account/ui/account-list";
import { RouteNames } from "@/routes";
import { useNavigate } from "react-router";
export const AccountListPage = () => {
  const navigate = useNavigate();
  return (
    <PageContainer
      header={<PrivasuiHeader onClick={() => navigate(`/${RouteNames.Home}`)} />}
      footer={
        <>
          <AccountListFooter />
        </>
      }
    >
      <AccountList />
      <Outlet />
    </PageContainer>
  );
};

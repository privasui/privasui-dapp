import { Navigate, Routes, Route, BrowserRouter as Router } from "react-router";

import { AppLayout } from "./app/app-layout/ui";
import { Connect } from "./pages/connect/ui";
import { AccountLayout } from "./app/account-layout/ui";
import { AccountListPage } from "./pages/account-list/ui";
import { CreateAccount } from "./pages/create-account/ui";
import { CreateProfile } from "./pages/create-profile/ui";
import { ImportAccount } from "./pages/import-account/ui";
import { ChatListPage } from "./pages/chat-list/ui";
import { ChatPanel } from "./pages/chat-panel/ui";
import { HomePage } from "./pages/home/ui";
import { PiNSBuyPage } from "./pages/pins-buy/ui";

export enum RouteNames {
  Home = "home",
  Connect = "connect",
  CreateProfile = "create-profile",
  ImportAccount = "import-account",
  Pim = "pim",
  ReceipentAddress = ":receipentAddress",
  Accounts = "accounts",
  CreateAccount = "create-account",
  PiNS = "pins",
}

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path={RouteNames.Home} element={<HomePage />} />
          <Route element={<AccountLayout />}>
            <Route
              path={`${RouteNames.Pim}/${RouteNames.ReceipentAddress}`}
              element={<ChatPanel />}
            />
            <Route path={RouteNames.Connect} element={<Connect />} />

            <Route path={RouteNames.Accounts} element={<AccountListPage />} />
            <Route
              path={RouteNames.ImportAccount}
              element={<ImportAccount />}
            />
            <Route
              path={RouteNames.CreateAccount}
              element={<CreateAccount />}
            />
            <Route
              path={RouteNames.CreateProfile}
              element={<CreateProfile />}
            />
            <Route path={RouteNames.Pim} element={<ChatListPage />} />
            <Route path={RouteNames.PiNS} element={<PiNSBuyPage />} />
          </Route>
          <Route path="*" element={<Navigate to={`/${RouteNames.Home}`} />} />
          <Route path="/" element={<Navigate to={`/${RouteNames.Home}`} />} />
        </Route>
      </Routes>
    </Router>
  );
};

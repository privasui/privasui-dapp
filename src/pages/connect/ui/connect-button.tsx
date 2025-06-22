import {
  ConnectButton as MyStenConnectButton,
} from "@mysten/dapp-kit";
import { FC } from "react";

export const ConnectButton: FC = () => {
  return (
    <MyStenConnectButton
      className="hover:cursor-pointer"
      style={{
        backgroundColor: "black",
        border: "1px solid #00ff00",
        color: "#00ff00",
      }}
    />
  );
}

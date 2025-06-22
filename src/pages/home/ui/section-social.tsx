import { Github } from "lucide-react";
import { FaDiscord, FaTelegram } from 'react-icons/fa';

export const SocialButtons = () => {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: "36px",
      marginBottom: "20px"
    }}>
      <a 
        href="https://x.com/privasui_xyz" 
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "rgba(255, 255, 255, 0.7)",
          transition: "color 0.2s ease",
          fontWeight: "bold",
          fontSize: "32px",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#00ff00";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
        }}
      >
        𝕏
      </a>
      <a 
        href="https://discord.gg/pKKymre3Yk"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "rgba(255, 255, 255, 0.7)",
          transition: "color 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#00ff00";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
        }}
      >
        <FaDiscord size={36} />
      </a>
      <a 
        href="https://t.me/PrivasuiCat" 
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "rgba(255, 255, 255, 0.7)",
          transition: "color 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#00ff00";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
        }}
      >
        <FaTelegram size={36} />
      </a>
      <a 
        href="https://github.com/privasui" 
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "rgba(255, 255, 255, 0.7)",
          transition: "color 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#00ff00";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
        }}
      >
        <Github size={36} />
      </a>
    </div>
  );
};

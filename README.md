<div align="center">

![Privasui Logo](https://privasui.xyz/images/logo-512x512.png)

# 🔐 Privasui Chat

### The World's First 100% On-Chain Private Messenger

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-privasui.xyz-00ff66?style=for-the-badge)](https://privasui.xyz)
[![Sui Network](https://img.shields.io/badge/Built_on-Sui_Blockchain-4DA2FF?style=for-the-badge&logo=sui&logoColor=white)](https://sui.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

[![X Follow](https://img.shields.io/twitter/follow/privasui_xyz?style=social&logo=x)](https://x.com/privasui_xyz)
[![Discord](https://img.shields.io/badge/Discord-Join_Server-7289DA?style=social&logo=discord)](https://discord.gg/privasui)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=social&logo=telegram&logoColor=white)](https://t.me/PrivasuiCat)

---

*Revolutionary Web3 messaging that puts privacy, ownership, and censorship resistance first.*

</div>

## 🚀 What is Privasui?

Privasui is the **world's first 100% on-chain private messenger** built on the Sui blockchain. Unlike traditional messaging apps like Telegram, WhatsApp, or Signal, every aspect of Privasui operates directly on the blockchain, ensuring true decentralization, complete transparency, and unbreakable privacy.

### 🎯 Key Features

- **🔒 End-to-End Encryption**: Messages secured with ED25519 and X25519 cryptographic protocols
- **🌐 100% On-Chain**: Both smart contracts and frontend are fully decentralized
- **🛡️ Censorship Resistant**: No single entity can shut down or control the service
- **👤 Zero-Knowledge**: Not even developers can access your encrypted conversations  
- **💎 True Ownership**: You own your messages as blockchain assets
- **💰 Built-in Wallet**: Integrated Web3 wallet with Sui ecosystem support

## 📸 Screenshots

| Chat Interface | Wallet Integration | Profile Management |
|----------------|-------------------|-------------------|
| ![Chat Screen](https://privasui.xyz/images/chat-screen.png) | ![Wallet Screen](https://privasui.xyz/images/wallet-screen.png) | *Profile screen coming soon* |

## 🏗️ Architecture

Privasui implements **Feature Sliced Design (FSD)** architecture:

```
src/
├── app/           # Application configuration & providers
├── pages/         # Route-level components
├── widgets/       # Complex business logic components
├── shared/        # Reusable utilities & UI components
└── components/    # Generic UI components
```

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: React Query + Zustand
- **Blockchain**: Sui SDK + dApp Kit
- **Encryption**: libsodium-wrappers
- **UI Components**: Radix UI + Framer Motion

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/privasui/privasui-app.git
cd privasui-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create environment files for different networks:

```bash
# .env.devnet
VITE_SUI_NETWORK=devnet
VITE_DEVNET_<PACKAGE_ID_HERE>=<value>

# .env.testnet  
VITE_SUI_NETWORK=testnet
VITE_TESTNET_<PACKAGE_ID_HERE>=<value>

# .env.mainnet
VITE_SUI_NETWORK=mainnet
VITE_MAINNET_<PACKAGE_ID_HERE>=<value>
```

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

```

## ❓ Frequently Asked Questions

<details>
<summary><strong>Why Privasui? Why another messenger?</strong></summary>

Privasui stands as the **world's first 100% on-chain private messenger**. Unlike Telegram, WhatsApp, or Signal, every aspect of Privasui operates directly on the blockchain.

What makes Privasui revolutionary:

- **Fully Transparent**: Both backend (Sui smart contracts) and frontend (Walrus-hosted) are completely auditable by anyone
- **Truly Decentralized**: No company, server, or individual controls your messages or can shut down the service
- **Censorship Resistant**: Exists entirely on the Sui blockchain, making it virtually impossible to censor
- **Cryptographically Secure**: Every message is secured using the same cryptographic principles that protect billions in cryptocurrency assets

</details>

<details>
<summary><strong>How are messages stored and encrypted? How secure is it?</strong></summary>

Privasui implements **enterprise-grade encryption** using the same cryptographic foundations that secure billions in Bitcoin and other digital assets.

Our security architecture:

- **End-to-end encryption**: Messages are encrypted before leaving your device using ED25519 and X25519 cryptographic protocols
- **Zero-knowledge design**: Encryption keys remain exclusively on your device
- **On-chain storage**: All messages exist as encrypted objects on the Sui blockchain
- **No backdoors**: Open-source design ensures no hidden vulnerabilities exist

</details>

<details>
<summary><strong>Who owns messages? Who can access them?</strong></summary>

**You do.** In Privasui, true digital ownership isn't just marketing — it's cryptographically guaranteed by the Sui blockchain.

- **Dual-stream architecture**: Every conversation consists of two separate message streams
- **Blockchain-verified ownership**: Your messages exist as digital assets you control
- **Permanent access rights**: Only conversation participants hold the cryptographic keys needed to decrypt messages
- **No corporate access**: Unlike traditional platforms, Privasui's architecture makes corporate access technically impossible

</details>

<details>
<summary><strong>Can my messages be censored or deleted?</strong></summary>

Since your message streams are on-chain assets that you own, and the content is end-to-end encrypted, **censorship is virtually impossible**. No central authority can read your messages or prevent delivery. Even Privasui developers cannot access or delete your encrypted messages.

</details>

<details>
<summary><strong>Do I need a crypto wallet to use Privasui Chat?</strong></summary>

**No** — Privasui is itself a fully-featured Web3 wallet with:

- **Built for the Pi ecosystem**: Essential Sui functionality (send/receive)
- **Security-first design**: Your keys remain exclusively on your device
- **Seamless integration**: Wallet functions naturally woven into messaging
- **User-friendly**: No blockchain expertise required

</details>

<details>
<summary><strong>Is Privasui Chat free to use?</strong></summary>

**Yes**, we don't charge for using Privasui Chat. You simply need a piNS name obtained when creating your profile. Standard Sui network fees apply but are typically very small.

</details>

## 🛣️ Roadmap

- [x] Core messaging functionality
- [x] End-to-end encryption
- [x] Integrated Web3 wallet
- [x] piNS integration
- [ ] Group messaging
- [ ] File sharing
- [ ] Voice messages
- [ ] Advanced wallet features
- [ ] Mobile app

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🌟 Community & Support

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/privasui)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/privasui_xyz)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/PrivasuiCat)
[![Website](https://img.shields.io/badge/Website-privasui.xyz-00ff66?style=for-the-badge&logo=globe&logoColor=white)](https://privasui.xyz)

**Join our community to stay updated and get support!**

</div>

## 💝 Support the Project

If you find Privasui valuable, consider supporting the development:

**Sui Address**: 0x625055fb6216363682effc533db34afc2082f7a55742bca413d2dcf695bc6c9b

---

<div align="center">

**Made with ❤️ for the decentralized future**

</div>

# RIF Staking Platform

A revolutionary DeFi platform that combines token swapping and staking in one seamless transaction, eliminating the need for multiple approvals and reducing users work.

## 🎯 Problem

Current DeFi platforms force users to:
- Swap tokens on one platform (e.g., Uniswap)
- Stake on another platform
- Pay multiple gas fees for each transaction
- Sign multiple approval transactions
- Wait for each step to complete

This fragmented experience is expensive, time-consuming, and frustrating for users.

## 💡 Solution

RIF Staking Platform solves this by:
- **One-Click Staking**: Swap any token to RIF and stake in a single transaction
- **Smart Approvals**: Intelligently checks existing allowances to avoid unnecessary approval popups
- **Batch Transactions**: Uses EIP-5792 to batch multiple operations into one signature
- **Atomic Safety**: All operations succeed or fail together, preventing partial failures

## 🚀 Features

- **Multi-Token Support**: Stake rUSDT, rBTC, rUSDC, wETH, and more
- **Real-Time Balances**: Live token balance display with copy-to-clipboard addresses
- **Smart Allowance Checking**: Only requests approvals when actually needed
- **Beautiful UI/UX**: Modern, intuitive interface built with React and Tailwind CSS
- **Transaction Tracking**: Real-time status updates and explorer links
- **Error Handling**: Graceful error handling with user-friendly messages

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + RainbowKit + Viem
- **Blockchain**: Rootstock Testnet + Base Sepolia
- **Batch Transactions**: EIP-5792 implementation

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
   VITE_RIF_BATCH_DEPOSITER=0xe38c8986823305bD73C2A33C60b4ba6D26024e19
   ```
   
   **Note**: Get your WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎮 Usage

### Getting Started

1. **Connect Wallet**
   - Click "Connect Wallet" in the top right
   - Select your preferred wallet (MetaMask, Rainbow, etc.)
   - Switch to Rootstock Testnet or Base Sepolia

2. **Select Tokens**
   - Choose tokens you want to stake from the available list
   - Enter amounts for each selected token
   - View real-time balance and estimated RIF output

3. **Execute Transaction**
   - Click "Swap & Stake" button
   - Approve tokens if needed (only when necessary)
   - Confirm the batch transaction
   - Wait for confirmation and view on explorer

### Supported Networks

- **Rootstock Testnet** (Chain ID: 31)
- **Base Sepolia** (Chain ID: 84532)

### Supported Tokens

- rUSDT (Rootstock USDT)
- rBTC (Rootstock Bitcoin) 
- rUSDC (Rootstock USD Coin)
- wETH (Wrapped Ethereum)
- Root Token
- Stock Token

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation header
│   ├── TokenSelector.tsx # Token selection interface
│   ├── SwapDepositInterface.tsx # Main transaction interface
│   └── ...
├── hooks/              # Custom React hooks
│   └── useBatchTransaction.ts # Batch transaction logic
├── constants/          # Configuration constants
├── contracts/          # Smart contract ABIs
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🧪 Testing

### Manual Testing

1. **Test Token Selection**
   - Select multiple tokens
   - Enter different amounts
   - Verify balance calculations

2. **Test Approval Flow**
   - First time: Should request approvals
   - Second time: Should skip if sufficient allowance

3. **Test Transaction Flow**
   - Rootstock: Multiple popups for approvals + main tx
   - Base Sepolia: Single popup for batch transaction

### Test Scenarios

- **Fresh Wallet**: No previous approvals
- **Partial Approvals**: Some tokens approved, others not
- **Full Approvals**: All tokens already approved
- **Insufficient Balance**: Not enough tokens
- **Network Errors**: Wrong network, RPC issues


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discord**: Join our community for discussions and support

## 🔗 Links

- **Live Demo**: [Add your deployed URL here]
- **Smart Contract**: [Add contract address/explorer link]
- **Documentation**: [Add docs link if available]

---

**Built with ❤️ for the DeFi community**
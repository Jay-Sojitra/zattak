# RIF Staking Platform Frontend

A modern React frontend for the RIF staking platform on Rootstock testnet. This application allows users to swap multiple tokens to tRIF and stake them in a single transaction.

## Features

- 🔄 **Multi-Token Swap**: Support for swapping multiple tokens (USDT, rUSDT, DOC) to tRIF
- ⚡ **One-Click Staking**: Automatically stake swapped tRIF tokens
- 🎨 **Modern UI**: Beautiful, responsive design with Rootstock branding
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🔗 **Wallet Integration**: Ready for wallet connection (MetaMask, WalletConnect, etc.)
- 🌈 **Rich Animations**: Smooth transitions and hover effects
- 📊 **Real-time Stats**: Display TVL, APY, and other metrics

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Wallet Connection**: RainbowKit + Wagmi + Viem (configured but not yet integrated)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit: `http://localhost:5173`

## Project Structure

```
Frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── WalletConnect.tsx
│   │   ├── TokenSelector.tsx
│   │   ├── SwapDepositInterface.tsx
│   │   └── StatsSection.tsx
│   ├── constants/        # Constants and configuration
│   │   └── tokens.ts
│   ├── utils/           # Utility functions
│   │   └── cn.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # App entry point
│   └── index.css        # Global styles
├── tailwind.config.js   # Tailwind configuration
└── package.json
```

## Key Components

### WalletConnect
- Handles wallet connection UI
- Shows connection status and address
- Ready for integration with actual wallet providers

### TokenSelector
- Multi-token selection interface
- Shows token balances and USD values
- Input validation and amount entry
- Real-time calculation of total value

### SwapDepositInterface
- Transaction summary and preview
- Advanced settings (slippage, gas estimation)
- Staking benefits display
- One-click swap and stake button

### StatsSection
- Displays platform statistics
- TVL, active stakers, APY, total swaps
- Real-time updates (mock data for now)

## Design System

### Colors
- **Rootstock Orange**: `#FF6B35`
- **RIF Blue**: `#00D4FF`
- **Dark Gray**: `#1A1A1A`
- **Light Gray**: `#F5F5F5`

### Components
- **btn-primary**: Gradient primary button
- **btn-secondary**: Secondary outline button
- **card**: Standard card component
- **card-gradient**: Gradient background card
- **input-field**: Standard input styling

## Environment Configuration

The app is currently configured for Rootstock Testnet:
- **Chain ID**: 31
- **RPC URL**: `https://public-node.testnet.rsk.co`
- **Explorer**: `https://explorer.testnet.rsk.co`

## Mock Data

Currently, the app uses mock data for:
- Token balances
- Wallet addresses
- Transaction estimates
- Platform statistics

This will be replaced with real data when contract integration is complete.

## Next Steps

1. **Contract Integration**: Connect to deployed RIFDepositContract
2. **Wallet Integration**: Implement actual wallet connection
3. **Real Data**: Replace mock data with blockchain data
4. **Transaction Handling**: Implement real transaction flow
5. **Error Handling**: Add comprehensive error handling
6. **Testing**: Add unit and integration tests

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Follow the existing code style
2. Add TypeScript types for all new components
3. Use Tailwind CSS classes for styling
4. Ensure mobile responsiveness
5. Test all user interactions

## License

Built for Rootstock ecosystem. See main project license.
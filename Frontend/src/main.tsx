import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'

import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { baseSepolia } from 'wagmi/chains'

// Rootstock Mainnet chain configuration with custom icon
const rootstockMainnet = {
  id: 30,
  name: 'Rootstock Mainnet',
  iconUrl: '/logo_light-1.png',
  iconBackground: '#FF6600',
  nativeCurrency: {
    decimals: 18,
    name: 'Rootstock Bitcoin',
    symbol: 'RBTC',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ROOTSTOCK_RPC_URL || 'https://public-node.rsk.co'],
    },
    public: {
      http: [import.meta.env.VITE_ROOTSTOCK_RPC_URL || 'https://public-node.rsk.co'],
    },
  },
  blockExplorers: {
    default: { name: 'Rootstock Explorer', url: 'https://explorer.rootstock.io' },
  },
  testnet: false,
} as const

// Rootstock Testnet chain configuration (kept for development)
const rootstockTestnet = {
  id: 31,
  name: 'Rootstock Testnet',
  iconUrl: '/logo_light-1.png',
  iconBackground: '#FFA500',
  nativeCurrency: {
    decimals: 18,
    name: 'Test RBTC',
    symbol: 'tRBTC',
  },
  rpcUrls: {
    default: {
      http: ['https://public-node.testnet.rsk.co'],
    },
  },
  blockExplorers: {
    default: { name: 'RSK Explorer', url: 'https://explorer.testnet.rsk.co' },
  },
  testnet: true,
} as const

const config = getDefaultConfig({
  appName: 'Zattak',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [rootstockMainnet, baseSepolia, rootstockTestnet],
  ssr: false,
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Rootstock Mainnet Token Addresses
export const TOKENS = {
  RUSDT: {
    address: '0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96',
    symbol: 'rUSDT',
    name: 'Tether USD (Rootstock)',
    decimals: 18,
    logoUrl: '/tether-usdt-logo.svg'
  },
  USDT: {
    address: '0xAf368c91793CB22739386DFCbBb2F1A9e4bCBeBf',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUrl: '/tether-usdt-logo.svg'
  },
  RBTC: {
    address: '0x542fda317318ebf1d3deaf76e0b632741a7e677d',
    symbol: 'WRBTC',
    name: 'Wrapped Rootstock Bitcoin',
    decimals: 18,
    logoUrl: '/bitcoin-btc-logo.svg'
  },
  WETH: {
    address: '0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    logoUrl: '/ethereum-eth-logo.svg'
  },
  RIF: {
    address: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5',
    symbol: 'RIF',
    name: 'RIF Token',
    decimals: 18,
    logoUrl: '/logo_light.jpg'
  }
} as const

// Contract Addresses - Update with deployed address
export const CONTRACTS = {
  RIF_DEPOSITER: '0x14b437488D0e6562E4f61E377BEF895233fdd917', // Update this with actual deployed address
  SUSHI_ROUTER: '0xAC4c6e212A361c968F1725b4d055b47E63F80b75',
  RIF_TOKEN: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5',
  STAKING_CONTRACT: '0x5Db91E24BD32059584bbdB831a901F1199f3D459'
} as const

// Rootstock Mainnet Configuration
export const NETWORK_CONFIG = {
  chainId: 30,
  name: 'Rootstock Mainnet',
  rpcUrl: import.meta.env.VITE_ROOTSTOCK_RPC_URL || 'https://public-node.rsk.co',
  blockExplorerUrl: 'https://explorer.rootstock.io',
  nativeCurrency: {
    name: 'Rootstock Bitcoin',
    symbol: 'RBTC',
    decimals: 18
  }
} as const

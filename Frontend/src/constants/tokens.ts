// Rootstock Testnet Token Addresses
export const TOKENS = {
  RUSDT: {
    address: '0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96',
    symbol: 'rUSDT',
    name: 'Rootstock USDT',
    decimals: 18,
    logoUrl: '/tokens/rusdt.png'
  },
  USDT: {
    address: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUrl: '/tokens/usdt.png'
  },
  TRIF: {
    address: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5',
    symbol: 'tRIF',
    name: 'Test RIF Token',
    decimals: 18,
    logoUrl: '/tokens/rif.png'
  },
  DOC: {
    address: '0x1bda44fda023f2af8280a16fd1b01d1a493ba6c4',
    symbol: 'DOC',
    name: 'Dollar on Chain',
    decimals: 18,
    logoUrl: '/tokens/doc.png'
  }
} as const

// Contract Addresses
export const CONTRACTS = {
  RIF_DEPOSIT: '0x...', // Will be filled when contract is deployed
  SUSHI_ROUTER: '0xAC4c6e212A361c968F1725b4d055b47E63F80b75',
  STAKING_CONTRACT: '0x5Db91E24BD32059584bbdB831a901F1199f3D459'
} as const

// Rootstock Testnet Configuration
export const NETWORK_CONFIG = {
  chainId: 31,
  name: 'Rootstock Testnet',
  rpcUrl: 'https://public-node.testnet.rsk.co',
  blockExplorerUrl: 'https://explorer.testnet.rsk.co',
  nativeCurrency: {
    name: 'Test RBTC',
    symbol: 'tRBTC',
    decimals: 18
  }
} as const

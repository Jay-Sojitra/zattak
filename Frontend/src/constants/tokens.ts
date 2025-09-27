// Rootstock Testnet Token Addresses
export const TOKENS = {
  RUSDT: {
    address: '0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96',
    symbol: 'rUSDT',
    name: 'Rootstock USDT',
    decimals: 18,
    logoUrl: '/tether-usdt-logo.svg'
  },
  RBTC: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'rBTC',
    name: 'Rootstock Bitcoin',
    decimals: 18,
    logoUrl: '/bitcoin-btc-logo.svg'
  },
  RUSDC: {
    address: '0x1bda44fda023f2af8280a16fd1b01d1a493ba6c4',
    symbol: 'rUSDC',
    name: 'Rootstock USD Coin',
    decimals: 6,
    logoUrl: '/usd-coin-usdc-logo.svg'
  },
  WETH: {
    address: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5',
    symbol: 'wETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    logoUrl: '/ethereum-eth-logo.svg'
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

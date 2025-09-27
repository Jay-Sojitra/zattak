// Rootstock Testnet Token Addresses (Updated with real addresses)
export const TOKENS = {
  RUSDT: {
    address: '0x9c3Ea773d4DFB6CbC4a3d88078643020285fd37C',
    symbol: 'rUSDT',
    name: 'Rootstock USDT',
    decimals: 18,
    logoUrl: '/tether-usdt-logo.svg'
  },
  RBTC: {
    address: '0xDF2c8f7852B3BAA4B728f8EAEfB75CCb3A76d363',
    symbol: 'rBTC',
    name: 'Rootstock Bitcoin',
    decimals: 18,
    logoUrl: '/bitcoin-btc-logo.svg'
  },
  RUSDC: {
    address: '0xCa552b5ac029864D9c0cFae2c760E57B22f6a268',
    symbol: 'rUSDC',
    name: 'Rootstock USD Coin',
    decimals: 6,
    logoUrl: '/usd-coin-usdc-logo.svg'
  },
  WETH: {
    address: '0x917532db0765F594c766E81ae12fA54Bf7E477E4',
    symbol: 'wETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    logoUrl: '/ethereum-eth-logo.svg'
  }
} as const

// Contract Addresses
export const CONTRACTS = {
  RIF_BATCH_DEPOSITER: '0xe38c8986823305bD73c2A33C60b4ba6d26024e19',
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

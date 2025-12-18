import tokenListData from './tokenList.json'

// Type definitions
export interface Token {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI: string
  tags: string[]
}

export interface TokenList {
  name: string
  version: {
    major: number
    minor: number
    patch: number
  }
  timestamp: string
  logoURI: string
  keywords: string[]
  tokens: Token[]
  tags: Record<string, {
    name: string
    description: string
  }>
}

// Load token list
const TOKEN_LIST: TokenList = tokenListData as TokenList

// Export all tokens
export const ALL_TOKENS: Token[] = TOKEN_LIST.tokens

// Get featured tokens (tokens with 'featured' tag)
export function getFeaturedTokens(): Token[] {
  return ALL_TOKENS.filter(token => token.tags.includes('featured'))
}

// Get tokens by tag
export function getTokensByTag(tag: string): Token[] {
  return ALL_TOKENS.filter(token => token.tags.includes(tag))
}

// Search tokens by symbol or name
export function searchTokens(query: string): Token[] {
  if (!query.trim()) return ALL_TOKENS

  const lowerQuery = query.toLowerCase().trim()
  return ALL_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(lowerQuery) ||
    token.name.toLowerCase().includes(lowerQuery) ||
    token.address.toLowerCase() === lowerQuery
  )
}

// Get token by address
export function getTokenByAddress(address: string): Token | undefined {
  return ALL_TOKENS.find(
    token => token.address.toLowerCase() === address.toLowerCase()
  )
}

// Get token by symbol
export function getTokenBySymbol(symbol: string): Token | undefined {
  return ALL_TOKENS.find(
    token => token.symbol.toLowerCase() === symbol.toLowerCase()
  )
}

// Legacy TOKENS object for backward compatibility
export const TOKENS = {
  RUSDT: {
    address: '0xEf213441a85DF4d7acBdAe0Cf78004E1e486BB96',
    symbol: 'rUSDT',
    name: 'Tether USD on RSK',
    decimals: 18,
    logoUrl: 'https://raw.githubusercontent.com/rsksmart/rsk-contract-metadata/refs/heads/master/images/usdt.png'
  },
  USDT: {
    address: '0xAF368c91793cb22739386DFCBbB2f1A9E4bcBEBf',
    symbol: 'USDT',
    name: 'USDT',
    decimals: 18,
    logoUrl: 'https://raw.githubusercontent.com/rsksmart/rsk-contract-metadata/refs/heads/master/images/usdt.png'
  },
  RBTC: {
    address: '0x967f8799aF07DF1534d48A95a5C9FEBE92c53ae0',
    symbol: 'WRBTC',
    name: 'Wrapped RBTC on RSK',
    decimals: 18,
    logoUrl: 'https://raw.githubusercontent.com/rsksmart/rsk-contract-metadata/refs/heads/master/images/wrbtc.png'
  },
  WETH: {
    address: '0x2F6f07CDcf3588944bF4C42Ac74fF24bf56e7590',
    symbol: 'WETH',
    name: 'WETH',
    decimals: 18,
    logoUrl: 'https://raw.githubusercontent.com/rsksmart/rsk-contract-metadata/refs/heads/master/images/weth.png'
  },
  RIF: {
    address: '0x2aCc95758f8b5F583470bA265Eb685a8f45fC9D5',
    symbol: 'RIF',
    name: 'RIF',
    decimals: 18,
    logoUrl: 'https://raw.githubusercontent.com/rsksmart/rsk-contract-metadata/refs/heads/master/images/rif.png'
  }
} as const

// Contract Addresses
export const CONTRACTS = {
  RIF_DEPOSITER: '0x14b437488D0e6562E4f61E377BEF895233fdd917',
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

// Available tags
export const AVAILABLE_TAGS = Object.keys(TOKEN_LIST.tags)

// Get tag info
export function getTagInfo(tag: string) {
  return TOKEN_LIST.tags[tag]
}

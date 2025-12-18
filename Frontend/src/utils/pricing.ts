import { TOKENS } from '../constants/tokens';

// Price API configuration with fallback support
interface PriceApiConfig {
  name: string;
  baseUrl: string;
  endpoint: (addresses: string[]) => string;
  parser: (data: any) => Record<string, number>;
  priority: number;
}

// Configure multiple price APIs with fallback support
const PRICE_APIS: PriceApiConfig[] = [
  {
    name: 'GeckoTerminal',
    baseUrl: 'https://api.geckoterminal.com/api/v2',
    endpoint: (addresses: string[]) =>
      `/simple/networks/rootstock/token_price/${addresses.map(addr => addr.toLowerCase()).join(',')}`,
    parser: (data: any) => {
      const prices: Record<string, number> = {};
      if (data?.data?.attributes?.token_prices) {
        Object.entries(data.data.attributes.token_prices).forEach(([address, priceString]: [string, any]) => {
          const price = parseFloat(String(priceString));
          if (!isNaN(price)) {
            prices[address.toLowerCase()] = price;
          }
        });
      }
      return prices;
    },
    priority: 1
  },
  {
    name: 'Blockscout',
    baseUrl: 'https://rootstock.blockscout.com/api/v2',
    endpoint: (addresses: string[]) => {
      // Blockscout doesn't support batch requests, so we'll handle single tokens
      // This will be used for individual token fallback
      return `/tokens/${addresses[0]}`;
    },
    parser: (data: any) => {
      const prices: Record<string, number> = {};
      if (data?.address_hash && data?.exchange_rate) {
        const address = data.address_hash.toLowerCase();
        const price = parseFloat(data.exchange_rate);
        if (!isNaN(price)) {
          prices[address] = price;
        }
      }
      return prices;
    },
    priority: 2
  }
];

// Cache interface
interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// In-memory cache for prices (5 minute TTL)
let priceCache: PriceCache = {
  prices: {},
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// Token address mapping for easy access
const TOKEN_ADDRESSES = {
  RUSDT: TOKENS.RUSDT.address,
  USDT: TOKENS.USDT.address,
  RBTC: TOKENS.RBTC.address,
  WETH: TOKENS.WETH.address,
  RIF: TOKENS.RIF.address
};

// Fetch prices from a single API with enhanced retry
async function fetchPricesFromApi(
  api: PriceApiConfig,
  addresses: string[],
  { maxRetries = 4, baseDelayMs = 1000, backoffMultiplier = 2 } = {}
): Promise<Record<string, number>> {
  const url = `${api.baseUrl}${api.endpoint(addresses)}`;
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt <= maxRetries) {
    try {
      console.log(`🔄 Fetching prices from ${api.name} (attempt ${attempt + 1}/${maxRetries + 1}):`, url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (attempt > 0) {
        console.log(`✅ ${api.name} price fetch succeeded on attempt ${attempt + 1}`);
      }

      console.log(`${api.name} raw response:`, data);

      const prices = api.parser(data);
      console.log(`${api.name} parsed prices:`, prices);

      return prices;
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ ${api.name} attempt ${attempt + 1} failed:`, error.message);

      if (attempt === maxRetries) {
        console.error(`🚨 All ${maxRetries + 1} attempts failed for ${api.name}`);
        throw new Error(`${api.name} failed after ${maxRetries + 1} attempts. Last error: ${error.message}`);
      }

      // Exponential backoff with jitter
      const backoffDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
      const jitter = Math.random() * 1000; // Add up to 1000ms jitter
      const waitTime = backoffDelay + jitter;

      console.log(`⏳ Retrying ${api.name} in ${Math.round(waitTime)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt += 1;
    }
  }

  throw lastError;
}

// Fetch prices with fallback support - prioritizes API prices per token
export async function fetchTokenPrices(
  tokenAddresses?: string[]
): Promise<Record<string, number>> {
  const addresses = tokenAddresses || Object.values(TOKEN_ADDRESSES);
  const normalizedAddresses = addresses.map(addr => addr.toLowerCase());

  // Check cache first
  const now = Date.now();
  if (priceCache.timestamp > 0 && (now - priceCache.timestamp) < priceCache.ttl) {
    const cachedPrices: Record<string, number> = {};
    let hasCachedData = false;

    normalizedAddresses.forEach(address => {
      if (priceCache.prices[address] !== undefined) {
        cachedPrices[address] = priceCache.prices[address];
        hasCachedData = true;
      }
    });

    if (hasCachedData && Object.keys(cachedPrices).length === normalizedAddresses.length) {
      console.log('✅ Using cached prices:', cachedPrices);
      return cachedPrices;
    }
  }

  const finalPrices: Record<string, number> = {};
  const missingTokens = [...normalizedAddresses];

  // Try APIs in order of priority, collecting prices token by token
  const sortedApis = [...PRICE_APIS].sort((a, b) => a.priority - b.priority);

  for (const api of sortedApis) {
    if (missingTokens.length === 0) break;

    try {
      console.log(`🔄 Trying ${api.name} for ${missingTokens.length} remaining tokens...`);

      // For Blockscout (individual token API), try each missing token separately
      if (api.name === 'Blockscout') {
        for (const tokenAddress of [...missingTokens]) {
          try {
            const prices = await fetchPricesFromApi(api, [tokenAddress]);
            if (prices[tokenAddress] && prices[tokenAddress] > 0) {
              finalPrices[tokenAddress] = prices[tokenAddress];
              const index = missingTokens.indexOf(tokenAddress);
              if (index > -1) {
                missingTokens.splice(index, 1);
              }
              console.log(`✅ ${api.name} provided price for ${tokenAddress}: $${prices[tokenAddress]}`);
            }
          } catch (error) {
            console.warn(`❌ ${api.name} failed for ${tokenAddress}:`, error);
          }
        }
      } else {
        // For batch APIs like GeckoTerminal, try all remaining tokens at once
        const prices = await fetchPricesFromApi(api, missingTokens);

        // Add successful prices and remove them from missing list
        Object.entries(prices).forEach(([address, price]) => {
          if (price && price > 0) {
            finalPrices[address] = price;
            const index = missingTokens.indexOf(address);
            if (index > -1) {
              missingTokens.splice(index, 1);
            }
            console.log(`✅ ${api.name} provided price for ${address}: $${price}`);
          }
        });
      }
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error);
    }
  }

  // For any remaining missing tokens, use fallback prices
  if (missingTokens.length > 0) {
    console.log(`🔄 Using fallback prices for ${missingTokens.length} tokens:`, missingTokens);
    const fallbackPrices = getFallbackPrices(missingTokens);
    Object.assign(finalPrices, fallbackPrices);
  }

  // Update cache with final prices
  priceCache = {
    prices: { ...priceCache.prices, ...finalPrices },
    timestamp: now,
    ttl: priceCache.ttl
  };

  console.log('🎯 Final price compilation:', finalPrices);
  return finalPrices;
}

// Fallback prices when APIs fail
function getFallbackPrices(addresses: string[]): Record<string, number> {
  const fallbackPrices: Record<string, number> = {};

  addresses.forEach(address => {
    const normalizedAddr = address.toLowerCase();
    // Use reasonable fallback prices
    if (normalizedAddr === TOKEN_ADDRESSES.RUSDT.toLowerCase()) {
      fallbackPrices[normalizedAddr] = 1.0; // rUSDT ≈ $1
    } else if (normalizedAddr === TOKEN_ADDRESSES.USDT.toLowerCase()) {
      fallbackPrices[normalizedAddr] = 1.0; // USDT ≈ $1
    } else if (normalizedAddr === TOKEN_ADDRESSES.WETH.toLowerCase()) {
      fallbackPrices[normalizedAddr] = 2500.0; // WETH ≈ $2500
    } else if (normalizedAddr === TOKEN_ADDRESSES.RBTC.toLowerCase()) {
      fallbackPrices[normalizedAddr] = 65000; // RBTC ≈ $65,000 (distinguishable from real price)
    } else if (normalizedAddr === TOKEN_ADDRESSES.RIF.toLowerCase()) {
      fallbackPrices[normalizedAddr] = 0.10; // RIF ≈ $0.10 (fallback estimate)
    } else {
      fallbackPrices[normalizedAddr] = 1.0; // Default fallback
    }
  });

  console.log('Using fallback prices:', fallbackPrices);
  return fallbackPrices;
}

// Get price for a specific token
export async function getTokenPrice(tokenAddress: string): Promise<number> {
  try {
    const prices = await fetchTokenPrices([tokenAddress]);
    return prices[tokenAddress.toLowerCase()] || 0;
  } catch (error) {
    console.error(`Failed to get price for token ${tokenAddress}:`, error);
    return 0;
  }
}

// Get prices for multiple specific tokens
export async function getTokenPrices(tokenAddresses: string[]): Promise<Record<string, number>> {
  return fetchTokenPrices(tokenAddresses);
}

// Get all supported token prices
export async function getAllTokenPrices(): Promise<Record<string, number>> {
  return fetchTokenPrices();
}

// Utility function to calculate USD value
export function calculateUSDValue(tokenAmount: string, pricePerToken: number): number {
  const amount = parseFloat(tokenAmount || '0');
  return amount * pricePerToken;
}

// Format USD value for display
export function formatUSDValue(usdValue: number): string {
  if (usdValue === 0) return '$0.00';
  if (usdValue < 0.01) return '<$0.01';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(usdValue);
}

// Clear price cache (useful for testing or manual refresh)
export function clearPriceCache(): void {
  priceCache = {
    prices: {},
    timestamp: 0,
    ttl: priceCache.ttl
  };
  console.log('Price cache cleared');
}

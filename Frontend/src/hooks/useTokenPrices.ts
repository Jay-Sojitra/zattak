import { useState, useEffect, useCallback } from 'react';
import {
  fetchTokenPrices,
  getTokenPrice,
  calculateUSDValue,
  formatUSDValue
} from '../utils/pricing';

interface TokenPrice {
  address: string;
  priceUSD: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseTokenPricesReturn {
  prices: Record<string, TokenPrice>;
  isLoading: boolean;
  error: string | null;
  refreshPrices: () => Promise<void>;
  getPrice: (address: string) => number;
  calculateValue: (tokenAddress: string, amount: string) => number;
  formatValue: (tokenAddress: string, amount: string) => string;
}

// Custom hook for fetching and managing token prices
export function useTokenPrices(tokenAddresses?: string[]): UseTokenPricesReturn {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prices function
  const fetchPrices = useCallback(async (addresses?: string[]) => {
    if (!addresses || addresses.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching prices for tokens:', addresses);
      const priceData = await fetchTokenPrices(addresses);
      const now = new Date();

      setPrices(prev => {
        const updated = { ...prev };
        addresses.forEach(address => {
          const normalizedAddr = address.toLowerCase();
          const price = priceData[normalizedAddr] || 0;

          updated[normalizedAddr] = {
            address: normalizedAddr,
            priceUSD: price,
            isLoading: false,
            error: price === 0 ? 'Price not available' : null,
            lastUpdated: now
          };
        });
        return updated;
      });

      console.log('Successfully updated token prices:', priceData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch token prices';
      console.error('Token price fetch error:', err);
      setError(errorMessage);

      // Update individual token errors
      if (addresses) {
        setPrices(prev => {
          const updated = { ...prev };
          addresses.forEach(address => {
            const normalizedAddr = address.toLowerCase();
            if (updated[normalizedAddr]) {
              updated[normalizedAddr] = {
                ...updated[normalizedAddr],
                isLoading: false,
                error: errorMessage
              };
            }
          });
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh prices manually
  const refreshPrices = useCallback(async () => {
    const addresses = tokenAddresses || Object.keys(prices);
    await fetchPrices(addresses);
  }, [tokenAddresses, prices, fetchPrices]);

  // Get price for a specific token
  const getPrice = useCallback((address: string): number => {
    const normalizedAddr = address.toLowerCase();
    return prices[normalizedAddr]?.priceUSD || 0;
  }, [prices]);

  // Calculate USD value for a token amount
  const calculateValue = useCallback((tokenAddress: string, amount: string): number => {
    const price = getPrice(tokenAddress);
    return calculateUSDValue(amount, price);
  }, [getPrice]);

  // Format USD value for display
  const formatValue = useCallback((tokenAddress: string, amount: string): string => {
    const value = calculateValue(tokenAddress, amount);
    return formatUSDValue(value);
  }, [calculateValue]);

  // Effect to fetch prices when addresses change
  useEffect(() => {
    if (tokenAddresses && tokenAddresses.length > 0) {
      console.log('Initializing prices for:', tokenAddresses);
      const initialPrices: Record<string, TokenPrice> = {};
      tokenAddresses.forEach(address => {
        const normalizedAddr = address.toLowerCase();
        initialPrices[normalizedAddr] = {
          address: normalizedAddr,
          priceUSD: 0,
          isLoading: true,
          error: null,
          lastUpdated: null
        };
      });
      setPrices(initialPrices);

      // Fetch prices once
      fetchPrices(tokenAddresses);
    }
  }, [JSON.stringify(tokenAddresses)]); // Use JSON.stringify to avoid infinite loops

  // Auto-refresh prices every 5 minutes (disabled for now to prevent hanging)
  // useEffect(() => {
  //   if (!tokenAddresses || tokenAddresses.length === 0) return;

  //   const interval = setInterval(() => {
  //     console.log('Auto-refreshing token prices...');
  //     fetchPrices(tokenAddresses);
  //   }, 5 * 60 * 1000); // 5 minutes

  //   return () => clearInterval(interval);
  // }, [JSON.stringify(tokenAddresses)]);

  return {
    prices,
    isLoading,
    error,
    refreshPrices,
    getPrice,
    calculateValue,
    formatValue
  };
}

// Hook for a single token price
export function useTokenPrice(tokenAddress: string) {
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!tokenAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const priceValue = await getTokenPrice(tokenAddress);
      setPrice(priceValue);
      setLastUpdated(new Date());

      if (priceValue === 0) {
        setError('Price not available');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch token price';
      setError(errorMessage);
      console.error(`Error fetching price for ${tokenAddress}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    fetchPrice();
  }, [tokenAddress]); // Only depend on tokenAddress

  // Auto-refresh disabled to prevent hanging
  // useEffect(() => {
  //   if (!tokenAddress) return;

  //   const interval = setInterval(fetchPrice, 5 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [fetchPrice, tokenAddress]);

  const calculateValue = useCallback((amount: string): number => {
    return calculateUSDValue(amount, price);
  }, [price]);

  const formatValue = useCallback((amount: string): string => {
    const value = calculateValue(amount);
    return formatUSDValue(value);
  }, [calculateValue]);

  return {
    price,
    isLoading,
    error,
    lastUpdated,
    refreshPrice: fetchPrice,
    calculateValue,
    formatValue
  };
}

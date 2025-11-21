import { useState, useEffect, useCallback } from 'react';
import { parseUnits } from 'viem';
import { 
  getSwapQuote, 
  getMultipleSwapQuotes, 
  calculateTotalRIFOutput,
  formatRIFAmount,
  type SwapQuote 
} from '../utils/swapQuotes';
import type { SelectedToken } from '../types';

interface UseSwapQuotesReturn {
  quotes: SwapQuote[];
  totalRIF: string;
  totalPriceImpact: number;
  isLoading: boolean;
  error: string | null;
  refreshQuotes: () => Promise<void>;
  getQuoteForToken: (tokenAddress: string) => SwapQuote | null;
}

// Hook for managing swap quotes for multiple tokens to RIF
export function useSwapQuotes(
  selectedTokens: SelectedToken[],
  userAddress?: string
): UseSwapQuotesReturn {
  const [quotes, setQuotes] = useState<SwapQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare tokens and amounts for quote fetching
  const prepareQuoteParams = useCallback(() => {
    if (!selectedTokens || !userAddress) return null;

    const validTokens = selectedTokens.filter(token => 
      token.amount && parseFloat(token.amount) > 0
    );

    if (validTokens.length === 0) return null;

    const tokens = validTokens.map(token => token.address);
    const amounts = validTokens.map(token => 
      parseUnits(token.amount!, token.decimals)
    );

    return { tokens, amounts, validTokens };
  }, [selectedTokens, userAddress]);

  // Fetch quotes function
  const fetchQuotes = useCallback(async () => {
    const params = prepareQuoteParams();
    if (!params || !userAddress) {
      setQuotes([]);
      setError(null);
      return;
    }

    const { tokens, amounts } = params;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching swap quotes for tokens:', tokens);
      const newQuotes = await getMultipleSwapQuotes(
        tokens, 
        amounts, 
        userAddress,
        0.005 // 0.5% slippage
      );

      setQuotes(newQuotes);
      
      const failedQuotes = newQuotes.filter(q => !q.success);
      if (failedQuotes.length > 0) {
        console.warn('Some quotes failed:', failedQuotes.map(q => q.error));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch swap quotes';
      console.error('Swap quotes error:', err);
      setError(errorMessage);
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [prepareQuoteParams, userAddress]);

  // Manual refresh function
  const refreshQuotes = useCallback(async () => {
    await fetchQuotes();
  }, [fetchQuotes]);

  // Get quote for specific token
  const getQuoteForToken = useCallback((tokenAddress: string): SwapQuote | null => {
    return quotes.find(q => q.tokenIn.toLowerCase() === tokenAddress.toLowerCase()) || null;
  }, [quotes]);

  // Calculate totals
  const totals = calculateTotalRIFOutput(quotes);

  // Auto-fetch quotes when selected tokens change
  useEffect(() => {
    const params = prepareQuoteParams();
    if (params && userAddress) {
      // Add a small delay to avoid too many API calls
      const timer = setTimeout(() => {
        fetchQuotes();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setQuotes([]);
      setError(null);
    }
  }, [JSON.stringify(selectedTokens), userAddress]); // Use JSON.stringify to avoid infinite loops

  return {
    quotes,
    totalRIF: totals.totalRIFFormatted,
    totalPriceImpact: totals.totalPriceImpact,
    isLoading,
    error,
    refreshQuotes,
    getQuoteForToken
  };
}

// Hook for a single token swap quote
export function useSwapQuote(
  tokenAddress: string,
  amount: string,
  decimals: number,
  userAddress?: string
) {
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!tokenAddress || !amount || !userAddress || parseFloat(amount) <= 0) {
      setQuote(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountIn = parseUnits(amount, decimals);
      const newQuote = await getSwapQuote(tokenAddress, amountIn, userAddress);
      setQuote(newQuote);
      
      if (!newQuote.success) {
        setError(newQuote.error || 'Failed to get quote');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch swap quote';
      setError(errorMessage);
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, amount, decimals, userAddress]);

  useEffect(() => {
    if (tokenAddress && amount && userAddress && parseFloat(amount) > 0) {
      // Add a small delay to avoid too many API calls while user is typing
      const timer = setTimeout(() => {
        fetchQuote();
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setQuote(null);
      setError(null);
    }
  }, [tokenAddress, amount, decimals, userAddress]);

  const rifAmountFormatted = quote?.success ? formatRIFAmount(quote.amountOut) : '0';

  return {
    quote,
    rifAmount: rifAmountFormatted,
    priceImpact: quote?.priceImpact || 0,
    isLoading,
    error,
    refreshQuote: fetchQuote
  };
}
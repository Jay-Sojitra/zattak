import { ChainId } from 'sushi';
import { getSwap } from 'sushi/evm';
import { createPublicClient, http, formatUnits } from 'viem';
import { defineChain } from 'viem';
import { NETWORK_CONFIG, CONTRACTS } from '../constants/tokens';

// Define Rootstock chain for viem
const rootstock = defineChain({
  id: NETWORK_CONFIG.chainId,
  name: NETWORK_CONFIG.name,
  network: 'rootstock',
  nativeCurrency: NETWORK_CONFIG.nativeCurrency,
  rpcUrls: {
    default: { http: [NETWORK_CONFIG.rpcUrl] },
    public: { http: [NETWORK_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Rootstock Explorer', url: NETWORK_CONFIG.blockExplorerUrl },
  },
});

export interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOut: bigint;
  amountOutFormatted: string;
  priceImpact: number;
  calldata: string;
  gasEstimate?: bigint;
  route?: any;
  success: boolean;
  error?: string;
}

// Enhanced retry mechanism for swap quotes
async function fetchSwapQuoteWithRetry(
  params: any,
  { maxRetries = 5, baseDelayMs = 1000, backoffMultiplier = 1.5 } = {}
): Promise<any> {
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt <= maxRetries) {
    try {
      console.log(`Attempting swap quote (${attempt + 1}/${maxRetries + 1})...`);
      const result = await getSwap(params);

      if (attempt > 0) {
        console.log(`✅ Swap quote succeeded on attempt ${attempt + 1}`);
      }
      console.log("result for quote", result);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ Swap quote attempt ${attempt + 1} failed:`, error.message);

      if (attempt === maxRetries) {
        console.error(`🚨 All ${maxRetries + 1} swap quote attempts failed`);
        throw new Error(`Swap quote API failed after ${maxRetries + 1} attempts. Last error: ${error.message}`);
      }

      // Exponential backoff with jitter
      const backoffDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
      const jitter = Math.random() * 500; // Add up to 500ms jitter
      const waitTime = backoffDelay + jitter;

      console.log(`⏳ Retrying in ${Math.round(waitTime)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt += 1;
    }
  }

  throw lastError;
}

// Get swap quote for token to RIF
export async function getSwapQuote(
  tokenIn: string,
  amountIn: bigint,
  sender: string,
  maxSlippage: number = 0.005
): Promise<SwapQuote> {
  const quote: SwapQuote = {
    tokenIn,
    tokenOut: CONTRACTS.RIF_TOKEN,
    amountIn,
    amountOut: 0n,
    amountOutFormatted: '0',
    priceImpact: 0,
    calldata: '0x',
    success: false
  };

  try {
    const swapParams = {
      chainId: NETWORK_CONFIG.chainId as ChainId,
      tokenIn: tokenIn,
      tokenOut: CONTRACTS.RIF_TOKEN,
      sender: sender,
      amount: amountIn,
      maxSlippage: maxSlippage,
    };

    console.log('Getting swap quote for:', {
      tokenIn: tokenIn,
      amount: amountIn.toString(),
      sender: sender
    });

    const data = await fetchSwapQuoteWithRetry(swapParams);
    console.log('Full Swap Quote Data:', data);

    if (data.status === 'Success') {
      const { tx, route, amountOut, assumedAmountOut, priceImpact } = data;

      console.log('Sushi API response details:', {
        status: data.status,
        amountOut: amountOut,
        assumedAmountOut: assumedAmountOut,
        route: route,
        priceImpact: priceImpact,
        tx: tx ? { to: tx.to, value: tx.value, dataLength: tx.data?.length } : null
      });

      // Extract the expected output amount
      let outputAmount = 0n;
      let formattedOutput = '0';

      // Try multiple ways to extract the output amount
      try {
        if (assumedAmountOut && assumedAmountOut !== '0') {
          console.log('Using assumedAmountOut:', assumedAmountOut);
          outputAmount = BigInt(assumedAmountOut);
          formattedOutput = formatUnits(outputAmount, 18);
        } else if (amountOut && amountOut !== '0') {
          console.log('Using amountOut:', amountOut);
          outputAmount = BigInt(amountOut);
          formattedOutput = formatUnits(outputAmount, 18);
        } else if (route?.amountOut && route.amountOut !== '0') {
          console.log('Using route.amountOut:', route.amountOut);
          outputAmount = BigInt(route.amountOut);
          formattedOutput = formatUnits(outputAmount, 18);
        } else if (route?.legs && route.legs.length > 0) {
          console.log('Checking route legs:', route.legs);
          const lastLeg = route.legs[route.legs.length - 1];
          if (lastLeg?.amountOut && lastLeg.amountOut !== '0') {
            console.log('Using lastLeg.amountOut:', lastLeg.amountOut);
            outputAmount = BigInt(lastLeg.amountOut);
            formattedOutput = formatUnits(outputAmount, 18);
          }
        } else {
          console.warn('No valid amountOut found in response:', { amountOut, assumedAmountOut, route });
          quote.error = 'No output amount in quote response';
        }
      } catch (parseError) {
        console.error('Error parsing amountOut:', parseError);
        quote.error = `Failed to parse output amount: ${parseError}`;
      }

      quote.amountOut = outputAmount;
      quote.amountOutFormatted = formattedOutput;
      quote.priceImpact = priceImpact || 0;
      quote.calldata = tx.data;
      quote.route = route;
      quote.success = true;

      // Try to estimate gas
      try {
        const publicClient = createPublicClient({
          chain: rootstock,
          transport: http(NETWORK_CONFIG.rpcUrl),
        });

        const gasEstimate = await publicClient.estimateGas({
          account: tx.from as `0x${string}`,
          to: tx.to,
          data: tx.data,
          value: tx.value,
        });
        quote.gasEstimate = gasEstimate;
      } catch (gasError) {
        console.log('Gas estimation failed (non-critical):', gasError);
      }

      console.log('Swap quote successful:', {
        amountIn: amountIn.toString(),
        amountOut: outputAmount.toString(),
        amountOutFormatted: formattedOutput,
        priceImpact: quote.priceImpact
      });

    } else {
      quote.error = `Swap quote failed: ${data.status}`;
      console.error('Swap quote failed:', data);
    }
  } catch (error: any) {
    quote.error = `Failed to get swap quote: ${error.message}`;
    console.error('Error getting swap quote:', error);
  }

  return quote;
}

// Get quotes for multiple tokens to RIF
export async function getMultipleSwapQuotes(
  tokens: string[],
  amounts: bigint[],
  sender: string,
  maxSlippage: number = 0.005
): Promise<SwapQuote[]> {
  if (tokens.length !== amounts.length) {
    throw new Error('Tokens and amounts arrays must have the same length');
  }

  console.log('Getting quotes for multiple tokens:', tokens.length);

  // Get quotes in parallel for better performance
  const promises = tokens.map(async (token, index) => {
    try {
      if (amounts[index] <= 0n) {
        return {
          tokenIn: token,
          tokenOut: CONTRACTS.RIF_TOKEN,
          amountIn: amounts[index],
          amountOut: 0n,
          amountOutFormatted: '0',
          priceImpact: 0,
          calldata: '0x',
          success: false,
          error: 'Invalid amount'
        } as SwapQuote;
      }

      return await getSwapQuote(token, amounts[index], sender, maxSlippage);
    } catch (error: any) {
      return {
        tokenIn: token,
        tokenOut: CONTRACTS.RIF_TOKEN,
        amountIn: amounts[index],
        amountOut: 0n,
        amountOutFormatted: '0',
        priceImpact: 0,
        calldata: '0x',
        success: false,
        error: error.message
      } as SwapQuote;
    }
  });

  const results = await Promise.all(promises);

  console.log('Multiple quotes completed:', {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });

  return results;
}

// Calculate total RIF output from multiple swaps
export function calculateTotalRIFOutput(quotes: SwapQuote[]): {
  totalRIF: bigint;
  totalRIFFormatted: string;
  totalPriceImpact: number;
  successfulQuotes: number;
} {
  const successfulQuotes = quotes.filter(q => q.success);

  const totalRIF = successfulQuotes.reduce((sum, quote) => sum + quote.amountOut, 0n);
  const totalRIFFormatted = formatUnits(totalRIF, 18);

  // Calculate weighted average price impact
  const totalPriceImpact = successfulQuotes.length > 0
    ? successfulQuotes.reduce((sum, quote) => sum + quote.priceImpact, 0) / successfulQuotes.length
    : 0;

  return {
    totalRIF,
    totalRIFFormatted,
    totalPriceImpact,
    successfulQuotes: successfulQuotes.length
  };
}

// Format RIF amount for display
export function formatRIFAmount(amount: bigint, decimals: number = 4): string {
  const formatted = formatUnits(amount, 18);
  const num = parseFloat(formatted);

  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals
  }).format(num);
}

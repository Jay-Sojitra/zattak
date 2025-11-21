import { ChainId } from 'sushi';
import { getSwap } from 'sushi/evm';
import { createPublicClient, http } from 'viem';
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

const publicClient = createPublicClient({
  chain: rootstock,
  transport: http(NETWORK_CONFIG.rpcUrl),
});

interface SwapParams {
  tokenIn: string;
  amountIn: bigint;
  sender: string;
  maxSlippage?: number;
}

// Function to fetch swap with retry logic
async function fetchSwapWithRetry(
  params: any, 
  { maxRetries = 3, baseDelayMs = 1000 } = {}
): Promise<any> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      return await getSwap(params);
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw new Error(`Swap API failed after ${maxRetries + 1} attempts: ${error.message}`);
      }
      const waitTime = baseDelayMs * (attempt + 1);
      console.warn(`Swap API call failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
      console.warn(`Retrying in ${waitTime / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt += 1;
    }
  }
}

// Generate swap calldata for a single token
export async function generateSwapCalldata(params: SwapParams): Promise<string> {
  try {
    const swapParams = {
      chainId: NETWORK_CONFIG.chainId as ChainId,
      tokenIn: params.tokenIn,
      tokenOut: CONTRACTS.RIF_TOKEN,
      sender: params.sender,
      amount: params.amountIn,
      maxSlippage: params.maxSlippage || 0.005, // 0.5% default slippage
    };

    console.log('Generating swap calldata for:', {
      tokenIn: params.tokenIn,
      amount: params.amountIn.toString(),
      sender: params.sender
    });

    const data = await fetchSwapWithRetry(swapParams);

    if (data.status === 'Success') {
      const { tx } = data;
      console.log('Swap calldata generated successfully:', tx.data);
      
      // Optional: Verify the call (don't fail if simulation fails)
      try {
        await publicClient.call({
          account: tx.from as `0x${string}`,
          data: tx.data,
          to: tx.to,
          value: tx.value,
        });
        console.log('Swap simulation successful');
      } catch (error: any) {
        console.log('Swap simulation failed (non-critical):', error.message);
      }
      
      return tx.data;
    } else {
      throw new Error(`Swap generation failed: ${data.status}`);
    }
  } catch (error: any) {
    console.error('Error generating swap calldata:', error);
    throw new Error(`Failed to generate swap calldata: ${error.message}`);
  }
}

// Generate calldata for multiple tokens
export async function generateBatchCalldata(
  tokens: string[],
  amounts: bigint[],
  sender: string,
  maxSlippage: number = 0.005
): Promise<string[]> {
  if (tokens.length !== amounts.length) {
    throw new Error('Tokens and amounts arrays must have the same length');
  }

  const callDataArray: string[] = [];
  const errors: string[] = [];

  // Generate calldata for each token in parallel for better performance
  const promises = tokens.map(async (token, index) => {
    try {
      const calldata = await generateSwapCalldata({
        tokenIn: token,
        amountIn: amounts[index],
        sender,
        maxSlippage
      });
      return { index, calldata, success: true as const };
    } catch (error: any) {
      return { index, error: error.message, success: false as const };
    }
  });

  const results = await Promise.allSettled(promises);

  // Process results and maintain order
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    
    if (result.status === 'fulfilled' && result.value.success) {
      callDataArray[result.value.index] = result.value.calldata;
    } else {
      const errorMsg = result.status === 'rejected' 
        ? result.reason?.message || 'Unknown error'
        : result.value.error;
      errors.push(`Token ${i + 1}: ${errorMsg}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Failed to generate calldata for some tokens:\n${errors.join('\n')}`);
  }

  console.log('Batch calldata generation completed:', {
    tokensCount: tokens.length,
    calldataLength: callDataArray.length
  });

  return callDataArray;
}

// Estimate gas for the transaction (optional utility)
export async function estimateTransactionGas(
  contractAddress: string,
  calldata: string,
  sender: string
): Promise<bigint> {
  try {
    const gas = await publicClient.estimateGas({
      account: sender as `0x${string}`,
      to: contractAddress as `0x${string}`,
      data: calldata as `0x${string}`,
    });
    
    console.log('Estimated gas:', gas.toString());
    return gas;
  } catch (error: any) {
    console.error('Gas estimation failed:', error);
    // Return a reasonable default gas limit
    return BigInt(500000);
  }
}
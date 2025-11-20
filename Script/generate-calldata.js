
import 'dotenv/config';
import { ChainId } from 'sushi'; // May need to cast if ROOTSTOCK not in enum
import { getSwap } from 'sushi/evm';
import { createPublicClient, http, parseEther } from 'viem';
import { defineChain } from 'viem';

const rpcUrl = process.env.RSK_RPC_URL || 'https://mycrypto.rsk.co/';

// Define custom Rootstock chain for viem (Chain ID 30)
const rootstock = defineChain({
  id: 30,
  name: 'Rootstock',
  network: 'rootstock',
  nativeCurrency: { name: 'Rootstock Bitcoin', symbol: 'RBTC', decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] }, // Public RPC; replace if needed
    public: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Rootstock Explorer', url: 'https://explorer.rootstock.io' },
  },
});

const publicClient = createPublicClient({
  chain: rootstock,
  transport: http(rpcUrl),
});

async function fetchSwapWithRetry(params, { maxRetries = 3, baseDelayMs = 3000 } = {}) {
  let attempt = 0;
  // Use simple linear backoff to avoid hammering public API
  while (attempt <= maxRetries) {
    try {
      return await getSwap(params);
    } catch (error) {
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

// Function to get swap calldata
async function generateSwapCalldata(tokenIn, amountIn) {
  const data = await fetchSwapWithRetry({
    chainId: 30, // Use 30 directly; cast as ChainId if type error (e.g., 30 as ChainId)
    tokenIn: tokenIn,
    tokenOut: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5', // RIF
    sender: '0x14b437488D0e6562E4f61E377BEF895233fdd917', // Use whale address as recipient
    amount: amountIn, // BigInt amount (adjust for decimals)
    maxSlippage: 0.005, // 0.5%
  });

  console.log('Full Swap Data:', data);

  if (data.status === 'Success') {
    const { tx } = data;
    
    // The calldata is tx.data (use this in Foundry)
    console.log('Calldata for this swap:', tx.data);
    
    // Try to simulate (optional, for verification) - but don't fail if RPC is down
    try {
      const callResult = await publicClient.call({
        account: tx.from,
        data: tx.data,
        to: tx.to,
        value: tx.value,
      });
      console.log('Simulated Output:', callResult);
    } catch (error) {
      console.log('RPC simulation failed (this is optional):', error.message);
      console.log('Calldata generation was successful - you can use the calldata above');
    }

    return tx.data;
  } else {
    throw new Error('Swap generation failed');
  }
}

// Generate for rUSDT (0.1 rUSDT = 1e17 wei, 18 decimals)
generateSwapCalldata('0xef213441a85df4d7acbdae0cf78004e1e486bb96', 100000000000000000n)
  .then(calldata => console.log('rUSDT to RIF Calldata:', calldata))
  .catch(err => console.error(err));

// Generate for USDT (1 USDT = 1e6 wei, 6 decimals)
generateSwapCalldata('0x779ded0c9e1022225f8e0630b35a9b54be713736', 1000000n)
  .then(calldata => console.log('USDT to RIF Calldata:', calldata))
  .catch(err => console.error(err));

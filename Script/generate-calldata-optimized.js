
import 'dotenv/config';
import { ChainId } from 'sushi';
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
    default: { http: [rpcUrl] },
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

/**
 * Generate swap calldata with configurable recipient
 * @param {string} tokenIn - Input token address
 * @param {bigint} amountIn - Input amount (in wei, accounting for decimals)
 * @param {string} recipient - Address that will receive the RIF tokens
 *                             For gas optimization: use your contract address
 *                             For testing: use a whale or test address
 */
async function generateSwapCalldata(tokenIn, amountIn, recipient) {
  console.log(`\nGenerating swap calldata:`);
  console.log(`  Token In: ${tokenIn}`);
  console.log(`  Amount In: ${amountIn.toString()}`);
  console.log(`  Recipient: ${recipient}`);

  const data = await fetchSwapWithRetry({
    chainId: 30,
    tokenIn: tokenIn,
    tokenOut: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5', // RIF
    sender: recipient, // CRITICAL: This determines where RIF tokens are sent
    amount: amountIn,
    maxSlippage: 0.005, // 0.5%
  });

  console.log('Full Swap Data:', data);

  if (data.status === 'Success') {
    const { tx } = data;

    console.log('\n✅ Calldata for this swap:', tx.data);

    // Optional simulation
    try {
      const callResult = await publicClient.call({
        account: tx.from,
        data: tx.data,
        to: tx.to,
        value: tx.value,
      });
      console.log('Simulated Output:', callResult);
    } catch (error) {
      console.log('RPC simulation failed (optional):', error.message);
      console.log('Calldata generation was successful - you can use the calldata above');
    }

    return tx.data;
  } else {
    throw new Error('Swap generation failed');
  }
}

// ==========================================
// USAGE EXAMPLES
// ==========================================

const RUSDT = '0xef213441a85df4d7acbdae0cf78004e1e486bb96'; // 18 decimals
const USDT = '0x779ded0c9e1022225f8e0630b35a9b54be713736';  // 6 decimals

// For PRODUCTION (gas optimized):
// Replace with your deployed RIFDepositerOptimized contract address
const CONTRACT_ADDRESS = '0xYourContractAddress'; // <-- UPDATE THIS

// For TESTING:
// Use a whale address that has RIF tokens for testing
const WHALE_ADDRESS = '0x922164BBBd36Acf9E854AcBbF32faCC949fCAEef';

console.log('\n========================================');
console.log('PRODUCTION CALLDATA (Gas Optimized)');
console.log('========================================');
console.log('Use these when calling the optimized contract');
console.log('RIF tokens will go directly to the contract\n');

// Generate production calldata - RIF goes to contract
generateSwapCalldata(RUSDT, 100000000000000000n, CONTRACT_ADDRESS)
  .then(calldata => {
    console.log('\n📦 Production rUSDT -> RIF Calldata (use this in production)');
    console.log('Recipient:', CONTRACT_ADDRESS);
  })
  .catch(err => console.error('Error:', err));

generateSwapCalldata(USDT, 1000000n, CONTRACT_ADDRESS)
  .then(calldata => {
    console.log('\n📦 Production USDT -> RIF Calldata (use this in production)');
    console.log('Recipient:', CONTRACT_ADDRESS);
  })
  .catch(err => console.error('Error:', err));

console.log('\n========================================');
console.log('TESTING CALLDATA');
console.log('========================================');
console.log('Use these for testing before deployment');
console.log('RIF tokens will go to whale address\n');

// Generate test calldata - RIF goes to whale for testing
setTimeout(() => {
  generateSwapCalldata(RUSDT, 100000000000000000n, WHALE_ADDRESS)
    .then(calldata => {
      console.log('\n🧪 Test rUSDT -> RIF Calldata (use for testing)');
      console.log('Recipient:', WHALE_ADDRESS);
    })
    .catch(err => console.error('Error:', err));

  generateSwapCalldata(USDT, 1000000n, WHALE_ADDRESS)
    .then(calldata => {
      console.log('\n🧪 Test USDT -> RIF Calldata (use for testing)');
      console.log('Recipient:', WHALE_ADDRESS);
    })
    .catch(err => console.error('Error:', err));
}, 5000); // Delay to avoid rate limiting

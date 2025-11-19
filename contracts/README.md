# RIFDepositer - Gas-Optimized Multi-Token Swap & Stake

Smart contract for Rootstock that allows users to swap multiple tokens to RIF and stake in a single atomic transaction.

## Features

- ✅ **Multi-Token Support**: Swap multiple tokens to RIF in one transaction
- ✅ **Atomic Execution**: All swaps succeed or entire transaction reverts
- ✅ **Automatic Staking**: Received RIF is automatically staked
- ✅ **Slippage Protection**: Integrated with Sushiswap router slippage checks
- ✅ **Gas Optimized**: 10-20% gas savings through various optimizations
- ✅ **Battle Tested**: Comprehensive test suite with mainnet forking

## Contract Addresses (Rootstock Mainnet)

- **Sushiswap Router**: `0xAC4c6e212A361c968F1725b4d055b47E63F80b75`
- **RIF Token**: `0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5`
- **stRIF Staking**: `0x5Db91E24BD32059584bbdB831a901F1199f3D459`

## Gas Optimizations

The contract includes several gas optimizations:

1. **Combined Loops**: Transfer + approve in single loop (~21,000 gas saved)
2. **Unchecked Loop Counters**: Safe overflow skip (~63 gas per iteration)
3. **Custom Errors**: Instead of require strings (~24 gas per error)
4. **Removed Unnecessary Checks**: Direct approval without balance check (~2,600 gas per token)
5. **Storage Caching**: Cache array length (~3 gas per iteration)

**Total Savings**: ~26,476 gas for 2 tokens (10-15% reduction)

See [GAS_OPTIMIZATION_REPORT.md](./GAS_OPTIMIZATION_REPORT.md) for detailed analysis.

## Slippage Handling

Slippage is handled by the Sushiswap router through encoded calldata:
- SDK generates calldata with minimum output amounts based on user-selected slippage
- Router enforces minimum output on each swap
- If any swap fails (including slippage violation), entire transaction reverts
- No partial execution possible - all-or-nothing semantics

See [SLIPPAGE_HANDLING.md](./SLIPPAGE_HANDLING.md) for detailed explanation.

## Usage

### Build

```shell
forge build
```

### Test

Run tests with Rootstock mainnet fork:

```shell
# Test all scenarios
forge test --fork-url https://public-node.rsk.co -vvv

# Test with gas reporting
forge test --fork-url https://public-node.rsk.co --gas-report

# Test specific function
forge test --fork-url https://public-node.rsk.co -vvv --match-test testBothSwapsInOneCall
```

### Format

```shell
forge fmt
```

### Deploy

```shell
forge create --rpc-url https://public-node.rsk.co \
  --private-key <your_private_key> \
  src/RIFDepositer.sol:RIFDepositer
```

## Integration Example

```javascript
import { getSwap } from 'sushi/evm';

// Generate calldata with user-selected slippage
async function generateSwapCalldata(tokenIn, amountIn, slippage) {
  const data = await getSwap({
    chainId: 30, // Rootstock
    tokenIn,
    tokenOut: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5', // RIF
    sender: userAddress,
    amount: amountIn,
    maxSlippage: slippage / 100, // e.g., 0.005 for 0.5%
  });
  return data.tx.data;
}

// Execute multi-token swap + stake
async function swapAndStake(tokens, amounts, slippage) {
  // Generate calldata for each token
  const callDataArray = await Promise.all(
    tokens.map((token, i) => generateSwapCalldata(token, amounts[i], slippage))
  );

  // Execute atomic transaction
  await rifDepositerContract.executeCallsAndDeposit(
    tokens,
    amounts,
    callDataArray
  );
}
```

## User Approvals Required

Before calling the contract, users must approve:

1. **Input tokens**: Each token being swapped
   ```javascript
   await tokenContract.approve(rifDepositerAddress, amount);
   ```

2. **RIF token**: For pulling back after swap
   ```javascript
   await rifContract.approve(rifDepositerAddress, ethers.constants.MaxUint256);
   ```

## Security Considerations

- ✅ Atomic transactions (all-or-nothing)
- ✅ Slippage protection via router
- ✅ Array length validation
- ✅ No reentrancy vulnerabilities
- ✅ Overflow protection (Solidity 0.8.0+)
- ✅ No privileged functions

## Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [Gas Optimization Report](./GAS_OPTIMIZATION_REPORT.md)
- [Slippage Handling Guide](./SLIPPAGE_HANDLING.md)

## License

MIT

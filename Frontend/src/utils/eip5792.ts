import { encodeFunctionData } from 'viem'
import type { Address } from 'viem'

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

export interface BatchCall {
  to: Address
  data: `0x${string}`
  value?: `0x${string}`
}

export interface WalletCapabilities {
  atomicBatch?: {
    supported: boolean
  }
}

export interface SendCallsParams {
  calls: BatchCall[]
  chainId?: `0x${string}`
  from?: Address
}

export interface SendCallsResult {
  id: string
}

export interface CallsStatus {
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  receipts?: Array<{
    logs: Array<{
      address: string
      topics: string[]
      data: string
    }>
    status: string
    blockHash: string
    blockNumber: string
    gasUsed: string
    transactionHash: string
  }>
}

/**
 * Check if the wallet supports EIP-5792 atomic batch transactions
 */
export async function checkWalletCapabilities(provider: any): Promise<WalletCapabilities> {
  try {
    const capabilities = await provider.request({
      method: 'wallet_getCapabilities',
      params: []
    })
    
    return capabilities
  } catch (error) {
    console.warn('wallet_getCapabilities not supported:', error)
    return {}
  }
}

/**
 * Check if wallet supports atomic batch transactions
 */
export function supportsAtomicBatch(capabilities: WalletCapabilities): boolean {
  return capabilities.atomicBatch?.supported === true
}

/**
 * Get current allowance for a token
 */
export async function getCurrentAllowance(
  provider: any,
  tokenAddress: Address,
  owner: Address,
  spender: Address
): Promise<bigint> {
  try {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender]
    })

    const result = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: tokenAddress,
          data: data
        },
        'latest'
      ]
    })

    return BigInt(result)
  } catch (error) {
    console.error('Error getting allowance:', error)
    return 0n
  }
}

/**
 * Create approval transaction data
 */
export function createApprovalCall(
  tokenAddress: Address,
  spender: Address,
  amount: bigint
): BatchCall {
  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount]
  })

  return {
    to: tokenAddress,
    data,
    value: '0x0'
  }
}

/**
 * Send batch of calls using EIP-5792
 */
export async function sendBatchCalls(
  provider: any,
  params: SendCallsParams
): Promise<SendCallsResult> {
  try {
    const result = await provider.request({
      method: 'wallet_sendCalls',
      params: [params]
    })

    return result
  } catch (error) {
    console.error('Error sending batch calls:', error)
    throw error
  }
}

/**
 * Get status of batch calls
 */
export async function getCallsStatus(
  provider: any,
  batchId: string
): Promise<CallsStatus> {
  try {
    const status = await provider.request({
      method: 'wallet_getCallsStatus',
      params: [batchId]
    })

    return status
  } catch (error) {
    console.error('Error getting calls status:', error)
    throw error
  }
}

/**
 * Convert chain ID to hex format
 */
export function chainIdToHex(chainId: number): `0x${string}` {
  return `0x${chainId.toString(16)}`
}

/**
 * Prepare batch calls for token approvals and main contract call
 */
export async function prepareBatchCalls(
  provider: any,
  userAddress: Address,
  contractAddress: Address,
  tokens: Array<{
    address: Address
    amount: bigint
  }>,
  mainContractCallData: `0x${string}`
): Promise<{
  calls: BatchCall[]
  needsApprovals: boolean
}> {
  const calls: BatchCall[] = []
  let needsApprovals = false

  // Check allowances and prepare approval calls if needed
  for (const token of tokens) {
    const currentAllowance = await getCurrentAllowance(
      provider,
      token.address,
      userAddress,
      contractAddress
    )

    if (currentAllowance < token.amount) {
      needsApprovals = true
      const approvalCall = createApprovalCall(
        token.address,
        contractAddress,
        token.amount // Approve exact amount needed
      )
      calls.push(approvalCall)
    }
  }

  // Add main contract call
  calls.push({
    to: contractAddress,
    data: mainContractCallData,
    value: '0x0'
  })

  return {
    calls,
    needsApprovals
  }
}

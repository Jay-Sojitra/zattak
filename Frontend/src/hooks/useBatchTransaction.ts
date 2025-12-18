import { useState, useCallback } from 'react'
import { useAccount, useConfig, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { encodeFunctionData, parseUnits, getAddress } from 'viem'
import type { Address } from 'viem'
import { sendCalls } from "@wagmi/core"
import { CONTRACTS } from '../constants/tokens'
import RIFDepositerABI from '../contracts/RIFBatchDepositer.json'
import { generateBatchCalldata } from '../utils/calldata'
import type { SelectedToken } from '../types'

// ERC20 ABI for approve and allowance functions
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


interface BatchTransactionState {
  isLoading: boolean
  batchId: string | null
  hash: `0x${string}` | null
  error: string | null
  needsApprovals: boolean
  approvalStep: number // 0: not started, 1: approving, 2: approved, 3: executing main tx
  totalApprovals: number
  isEIP5792: boolean
}


export function useBatchTransaction() {
  const { address } = useAccount()
  const wagmiConfig = useConfig()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  // Traditional wagmi hooks for Rootstock
  const { writeContract, writeContractAsync, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const [state, setState] = useState<BatchTransactionState>({
    isLoading: false,
    batchId: null,
    hash: null,
    error: null,
    needsApprovals: false,
    approvalStep: 0,
    totalApprovals: 0,
    isEIP5792: false
  })

  // Check if we should use EIP-5792 (Base Sepolia = 84532, for Rootstock mainnet = 30, use traditional flow)
  const shouldUseEIP5792 = chainId === 84532

  // Check allowance for a specific token
  const checkAllowance = useCallback(async (
    tokenAddress: Address,
    owner: Address,
    spender: Address
  ): Promise<bigint> => {
    try {
      if (!publicClient) {
        console.error('Public client not available')
        return 0n
      }

      const result = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner, spender]
      })

      return result as bigint
    } catch (error) {
      console.error('Error checking allowance:', error)
      return 0n
    }
  }, [publicClient])

  // Execute batch transaction
  const executeBatchTransaction = useCallback(async (
    selectedTokens: SelectedToken[]
  ) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' }
    }

    // Prepare contract call parameters
    const tokenAddresses: Address[] = []
    const tokenAmounts: bigint[] = []

    // Convert token amounts to wei and ensure addresses are checksummed
    selectedTokens.forEach(token => {
      if (token.amount && parseFloat(token.amount) > 0) {
        // Use getAddress to ensure proper checksum
        tokenAddresses.push(getAddress(token.address) as Address)

        // Convert amount to wei based on token decimals
        const amountInWei = parseUnits(token.amount, token.decimals)
        tokenAmounts.push(amountInWei)
      }
    })

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      needsApprovals: tokenAddresses.length > 0,
      totalApprovals: tokenAddresses.length,
      isEIP5792: shouldUseEIP5792,
      approvalStep: 0
    }))

    try {
      if (shouldUseEIP5792) {
        // Base Sepolia: Use EIP-5792 batch transactions
        return await executeEIP5792Batch(tokenAddresses, tokenAmounts, 0n)
      } else {
        // Rootstock: Use traditional separate transactions with calldata generation
        return await executeRootstockFlow(tokenAddresses, tokenAmounts)
      }
    } catch (error: any) {
      console.error('Transaction error:', error)

      let errorMessage = 'Failed to execute transaction'
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error.message) {
        errorMessage = error.message
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))

      return { success: false, error: errorMessage }
    }
  }, [address, wagmiConfig, shouldUseEIP5792])

  // EIP-5792 batch execution for Base Sepolia
  const executeEIP5792Batch = useCallback(async (
    tokenAddresses: Address[],
    tokenAmounts: bigint[],
    totalRIFAmount: bigint
  ) => {
    if (!address) return { success: false, error: 'No address' }

    const calls: Array<{ to: Address; data: `0x${string}`; value?: bigint }> = []

    console.log('Checking allowances for EIP-5792 batch...')

    // Check allowances and create approval calls only for tokens that need them
    for (let i = 0; i < tokenAddresses.length; i++) {
      const currentAllowance = await checkAllowance(
        tokenAddresses[i],
        address,
        CONTRACTS.RIF_DEPOSITER as Address
      )

      console.log(`Token ${tokenAddresses[i]} - Current allowance: ${currentAllowance.toString()}, Required: ${tokenAmounts[i].toString()}`)

      if (currentAllowance < tokenAmounts[i]) {
        console.log(`Adding approval call for token: ${tokenAddresses[i]}`)

        const approveCalldata = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACTS.RIF_DEPOSITER as Address, tokenAmounts[i]],
        })

        calls.push({
          to: tokenAddresses[i],
          data: approveCalldata,
          value: BigInt(0)
        })
      } else {
        console.log(`Sufficient allowance for token: ${tokenAddresses[i]}`)
      }
    }

    // Prepare main contract call data
    const supplyCalldata = encodeFunctionData({
      abi: RIFDepositerABI.abi,
      functionName: 'executeCallsAndDeposit',
      args: [tokenAddresses, tokenAmounts, totalRIFAmount],
    })

    // Add main contract call
    calls.push({
      to: CONTRACTS.RIF_DEPOSITER as Address,
      data: supplyCalldata,
      value: BigInt(0)
    })

    console.log('EIP-5792 Batch calls:', {
      callsCount: calls.length,
      approvalsNeeded: calls.length - 1, // -1 for the main contract call
      calls: calls.map(call => ({
        to: call.to,
        dataLength: call.data.length
      }))
    })

    // Send batch calls using wagmi
    const { id } = await sendCalls(wagmiConfig, { calls })

    setState(prev => ({
      ...prev,
      batchId: id,
      isLoading: false
    }))

    return { success: true, batchId: id }
  }, [wagmiConfig, address, checkAllowance])

  // Rootstock flow with real-time calldata generation
  const executeRootstockFlow = useCallback(async (
    tokenAddresses: Address[],
    tokenAmounts: bigint[]
  ) => {
    if (!address) return { success: false, error: 'No address' }

    setState(prev => ({ ...prev, approvalStep: 1 }))

    try {
      // Step 1: Generate calldata for all swaps
      console.log('Generating swap calldata for tokens...')
      const callDataArray = await generateBatchCalldata(
        tokenAddresses,
        tokenAmounts,
        address,
        0.005 // 0.5% slippage
      )

      console.log('Generated calldata for all swaps:', callDataArray.length)

      // Step 2: Check allowances and execute approvals only if needed
      const approvalsNeeded: Array<{ tokenAddress: Address; amount: bigint; index: number }> = []

      setState(prev => ({ ...prev, approvalStep: 2 }))
      console.log('Checking allowances for tokens...')

      for (let i = 0; i < tokenAddresses.length; i++) {
        const currentAllowance = await checkAllowance(
          tokenAddresses[i],
          address,
          CONTRACTS.RIF_DEPOSITER as Address
        )

        console.log(`Token ${tokenAddresses[i]} - Current allowance: ${currentAllowance.toString()}, Required: ${tokenAmounts[i].toString()}`)

        if (currentAllowance < tokenAmounts[i]) {
          approvalsNeeded.push({
            tokenAddress: tokenAddresses[i],
            amount: tokenAmounts[i],
            index: i
          })
          console.log(`Approval needed for token ${i + 1}: ${tokenAddresses[i]}`)
        } else {
          console.log(`Sufficient allowance for token ${i + 1}: ${tokenAddresses[i]}`)
        }
      }

      setState(prev => ({
        ...prev,
        totalApprovals: approvalsNeeded.length,
        needsApprovals: approvalsNeeded.length > 0,
        approvalStep: 3
      }))

      // Step 3: Execute approvals only for tokens that need them
      for (let i = 0; i < approvalsNeeded.length; i++) {
        const approval = approvalsNeeded[i]
        setState(prev => ({ ...prev, approvalStep: 3 + i }))

        console.log(`Approving token ${i + 1}/${approvalsNeeded.length}: ${approval.tokenAddress}`)

        // Execute approval transaction and stop flow if user rejects
        try {
          await writeContractAsync({
            address: approval.tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.RIF_DEPOSITER as Address, approval.amount],
          })
        } catch (error: any) {
          console.error('Approval transaction rejected or failed:', error)
          const rawMessage = error?.shortMessage || error?.message || 'Failed to execute approval transaction'
          const isUserRejected = rawMessage.toLowerCase().includes('user rejected') || rawMessage.toLowerCase().includes('rejected the request')
          const message = isUserRejected ? 'You rejected the approval transaction' : rawMessage

          setState(prev => ({
            ...prev,
            isLoading: false,
            error: message,
          }))

          // Auto-clear error after a short delay
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              error: null,
              approvalStep: 0,
              needsApprovals: prev.needsApprovals, // keep flag so UI context remains if needed
            }))
          }, 2500)

          return { success: false, error: message }
        }

        // Add a small delay to prevent rapid-fire transactions
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Step 4: Execute main contract call with generated calldata
      setState(prev => ({ ...prev, approvalStep: 3 + approvalsNeeded.length + 1 }))

      console.log('Executing main contract call with generated calldata')

      try {
        await writeContractAsync({
          address: CONTRACTS.RIF_DEPOSITER as Address,
          abi: RIFDepositerABI.abi,
          functionName: 'executeCallsAndDeposit',
          args: [tokenAddresses, tokenAmounts, callDataArray],
        })
      } catch (error: any) {
        console.error('Main transaction rejected or failed:', error)
        const rawMessage = error?.shortMessage || error?.message || 'Failed to execute main transaction'
        const isUserRejected = rawMessage.toLowerCase().includes('user rejected') || rawMessage.toLowerCase().includes('rejected the request')
        const message = isUserRejected ? 'You rejected the main transaction' : rawMessage

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: message,
        }))

        setTimeout(() => {
          setState(prev => ({
            ...prev,
            error: null,
            approvalStep: 0,
          }))
        }, 2500)

        return { success: false, error: message }
      }

      setState(prev => ({
        ...prev,
        hash: hash || null,
        isLoading: false
      }))

      return { success: true, hash: hash }
    } catch (error: any) {
      console.error('Rootstock flow error:', error)
      setState(prev => ({
        ...prev,
        error: `Calldata generation failed: ${error.message}`,
        isLoading: false
      }))
      return { success: false, error: error.message }
    }
  }, [writeContract, hash, address, checkAllowance])

  // Reset state
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      batchId: null,
      hash: null,
      error: null,
      needsApprovals: false,
      approvalStep: 0,
      totalApprovals: 0,
      isEIP5792: false
    })
  }, [])

  return {
    ...state,
    executeBatchTransaction,
    reset,
    // Additional state for traditional flow
    hash: hash || state.hash,
    isConfirmed: isConfirmed || !!state.batchId,
    isPending: isPending || isConfirming,
    writeError,
    chainId,
    shouldUseEIP5792
  }
}

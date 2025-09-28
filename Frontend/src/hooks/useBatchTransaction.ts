import { useState, useCallback } from 'react'
import { useAccount, useConfig, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { encodeFunctionData, parseUnits } from 'viem'
import type { Address } from 'viem'
import { sendCalls } from "@wagmi/core"
import { CONTRACTS } from '../constants/tokens'
import RIFBatchDepositerABI from '../contracts/RIFBatchDepositer.json'
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
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
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
  
  // Check if we should use EIP-5792 (Base Sepolia = 84532)
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
    let totalRIFAmount = 0n

    // Convert token amounts to wei and calculate total RIF expected
    selectedTokens.forEach(token => {
      if (token.amount && parseFloat(token.amount) > 0) {
        tokenAddresses.push(token.address as Address)
        
        // Convert amount to wei based on token decimals
        const amountInWei = parseUnits(token.amount, token.decimals)
        tokenAmounts.push(amountInWei)

        // Calculate expected RIF amount for this token
        const rifRate = token.symbol === 'rUSDT' ? 17.1143 : 
                       token.symbol === 'rUSDC' ? 17.1143 : 
                       token.symbol === 'rBTC' ? 1882594 :
                       token.symbol === 'wETH' ? 56000 : 17.1143

        const rifAmount = parseFloat(token.amount) * rifRate
        totalRIFAmount += parseUnits(rifAmount.toString(), 18) // RIF has 18 decimals
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
        return await executeEIP5792Batch(tokenAddresses, tokenAmounts, totalRIFAmount)
      } else {
        // Rootstock: Use traditional separate transactions
        return await executeTraditionalFlow(tokenAddresses, tokenAmounts, totalRIFAmount)
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
        CONTRACTS.RIF_BATCH_DEPOSITER as Address
      )
      
      console.log(`Token ${tokenAddresses[i]} - Current allowance: ${currentAllowance.toString()}, Required: ${tokenAmounts[i].toString()}`)
      
      if (currentAllowance < tokenAmounts[i]) {
        console.log(`Adding approval call for token: ${tokenAddresses[i]}`)
        
        const approveCalldata = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACTS.RIF_BATCH_DEPOSITER as Address, tokenAmounts[i]],
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
      abi: RIFBatchDepositerABI.abi,
      functionName: 'executeCallsAndDeposit',
      args: [tokenAddresses, tokenAmounts, totalRIFAmount],
    })

    // Add main contract call
    calls.push({
      to: CONTRACTS.RIF_BATCH_DEPOSITER as Address,
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


  // Traditional flow for Rootstock (separate approvals + main tx)
  const executeTraditionalFlow = useCallback(async (
    tokenAddresses: Address[],
    tokenAmounts: bigint[],
    totalRIFAmount: bigint
  ) => {
    if (!address) return { success: false, error: 'No address' }

    // Step 1: Check allowances and execute approvals only if needed
    const approvalsNeeded: Array<{ tokenAddress: Address; amount: bigint; index: number }> = []
    
    console.log('Checking allowances for tokens...')
    
    for (let i = 0; i < tokenAddresses.length; i++) {
      const currentAllowance = await checkAllowance(
        tokenAddresses[i],
        address,
        CONTRACTS.RIF_BATCH_DEPOSITER as Address
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
      needsApprovals: approvalsNeeded.length > 0
    }))

    // Execute approvals only for tokens that need them
    for (let i = 0; i < approvalsNeeded.length; i++) {
      const approval = approvalsNeeded[i]
      setState(prev => ({ ...prev, approvalStep: i + 1 }))
      
      console.log(`Approving token ${i + 1}/${approvalsNeeded.length}: ${approval.tokenAddress}`)
      
      // Execute approval transaction
      writeContract({
        address: approval.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.RIF_BATCH_DEPOSITER as Address, approval.amount],
      })

      // In a real implementation, you'd want to wait for each approval confirmation
      // For now, we'll proceed to the next approval or main transaction
      
      // Add a small delay to prevent rapid-fire transactions
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Step 2: Execute main contract call
    setState(prev => ({ ...prev, approvalStep: approvalsNeeded.length + 1 }))
    
    console.log('Executing main contract call')
    
    writeContract({
      address: CONTRACTS.RIF_BATCH_DEPOSITER as Address,
      abi: RIFBatchDepositerABI.abi,
      functionName: 'executeCallsAndDeposit',
      args: [tokenAddresses, tokenAmounts, totalRIFAmount],
    })

    setState(prev => ({ 
      ...prev, 
      hash: hash || null,
      isLoading: false 
    }))

    return { success: true, hash: hash }
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

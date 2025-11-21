import React, { useState } from 'react'
import { Plus, Minus, Coins, Copy, Check, RefreshCw } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { TOKENS } from '../constants/tokens'
import { useTokenPrices } from '../hooks/useTokenPrices'
import type { SelectedToken } from '../types'

interface TokenSelectorProps {
  onTokenSelect: (tokens: SelectedToken[]) => void
  selectedTokens: SelectedToken[]
}

// Available tokens for Rootstock mainnet - using real token addresses
const AVAILABLE_TOKENS = [
  {
    address: TOKENS.RUSDT.address,
    symbol: TOKENS.RUSDT.symbol,
    name: TOKENS.RUSDT.name,
    decimals: TOKENS.RUSDT.decimals,
    logoUrl: TOKENS.RUSDT.logoUrl
  },
  {
    address: TOKENS.USDT.address,
    symbol: TOKENS.USDT.symbol,
    name: TOKENS.USDT.name,
    decimals: TOKENS.USDT.decimals,
    logoUrl: TOKENS.USDT.logoUrl
  },
  {
    address: TOKENS.RBTC.address,
    symbol: TOKENS.RBTC.symbol,
    name: TOKENS.RBTC.name,
    decimals: TOKENS.RBTC.decimals,
    logoUrl: TOKENS.RBTC.logoUrl
  },
  {
    address: TOKENS.WETH.address,
    symbol: TOKENS.WETH.symbol,
    name: TOKENS.WETH.name,
    decimals: TOKENS.WETH.decimals,
    logoUrl: TOKENS.WETH.logoUrl
  }
]

// Custom hook to fetch token balance
function useTokenBalance(tokenAddress: string, decimals: number) {
  const { address } = useAccount()
  
  // All tokens are ERC20 tokens, including rBTC at the specified contract address
  const { data: balance, isLoading, error } = useBalance({
    address: address,
    token: tokenAddress.trim() as `0x${string}`, // Trim any whitespace
  })

  // Debug logging
  React.useEffect(() => {
    if (address && tokenAddress) {
      console.log(`Fetching balance for token: ${tokenAddress.trim()}, user: ${address}`)
      if (error) {
        console.error(`Balance fetch error for ${tokenAddress}:`, error)
      }
      if (balance) {
        console.log(`Balance for ${tokenAddress}: ${balance.value.toString()} (${formatUnits(balance.value, decimals)})`)
      }
    }
  }, [address, tokenAddress, balance, error, decimals])

  const formattedBalance = balance ? formatUnits(balance.value, decimals) : '0'
  
  return {
    balance: formattedBalance,
    isLoading,
    raw: balance?.value || 0n,
    error
  }
}

// Component for individual token with real balance
function TokenCard({
  token,
  isSelected,
  selectedToken,
  onToggle,
  onAmountChange,
  getPrice,
  formatValue
}: {
  token: typeof AVAILABLE_TOKENS[0]
  isSelected: boolean
  selectedToken?: SelectedToken
  onToggle: () => void
  onAmountChange: (amount: string) => void
  getPrice: (address: string) => number
  formatValue: (address: string, amount: string) => string
}) {
  const { balance, isLoading, error } = useTokenBalance(token.address, token.decimals)
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(token.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const displayBalance = isLoading ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-rootstock-orange rounded-full animate-spin"></div>
      <span className="text-gray-400">Loading...</span>
    </div>
  ) : error ? (
    <div className="flex items-center gap-2">
      <span className="text-red-400 text-xs">Error</span>
    </div>
  ) : parseFloat(balance).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  })

  const maxAmount = isLoading ? '0' : balance
  const tokenPrice = getPrice(token.address)
  const balanceUSD = formatValue(token.address, balance)

  return (
    <div
      className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${isSelected
          ? 'border-rootstock-orange bg-orange-50'
          : 'border-gray-200 hover:border-rootstock-orange'
        }`}
      onClick={() => !isSelected && onToggle()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 p-1">
            <img
              src={token.logoUrl}
              alt={token.symbol}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800">{token.symbol}</p>
              <button
                onClick={handleCopyAddress}
                className="p-1 hover:bg-gray-100 rounded transition-colors group"
                title="Copy token address"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500">{token.name}</p>
            {tokenPrice > 0 && (
              <p className="text-xs text-gray-400">${tokenPrice.toFixed(4)} USD</p>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={`p-2 rounded-full transition-colors ${isSelected
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-rootstock-orange text-white hover:bg-rootstock-orange-dark'
            }`}
        >
          {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-500">Balance</p>
        <div className="font-semibold">
          {isLoading ? (
            displayBalance
          ) : (
            <div>
              <span>{displayBalance} {token.symbol}</span>
              {!error && tokenPrice > 0 && parseFloat(balance) > 0 && (
                <p className="text-sm text-gray-400 mt-1">{balanceUSD}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amount Input for Selected Tokens */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to swap
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder="0.00"
                value={selectedToken?.amount || ''}
                onChange={(e) => onAmountChange(e.target.value)}
                className="input-field text-lg"
                step="0.01"
                min="0"
                max={maxAmount}
                disabled={isLoading}
              />
              {/* USD Value Display */}
              {selectedToken?.amount && parseFloat(selectedToken.amount) > 0 && tokenPrice > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  ≈ {formatValue(token.address, selectedToken.amount)}
                </div>
              )}
            </div>
            <button
              onClick={() => onAmountChange(maxAmount)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              MAX
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TokenSelector({ onTokenSelect, selectedTokens }: TokenSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { address } = useAccount()
  
  // Get prices for all available tokens
  const tokenAddresses = AVAILABLE_TOKENS.map(token => token.address)
  const { getPrice, formatValue, refreshPrices, isLoading: pricesLoading, error: pricesError } = useTokenPrices(tokenAddresses)

  const filteredTokens = AVAILABLE_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTokenToggle = (token: typeof AVAILABLE_TOKENS[0]) => {
    const isSelected = selectedTokens.some(t => t.address === token.address)

    if (isSelected) {
      // Remove token
      const updated = selectedTokens.filter(t => t.address !== token.address)
      onTokenSelect(updated)
    } else {
      // Add token with placeholder balance (will be updated by real balance)
      const newToken: SelectedToken = {
        ...token,
        amount: '',
        balance: '0' // This will be overridden by real balance display
      }
      onTokenSelect([...selectedTokens, newToken])
    }
  }

  const handleAmountChange = (tokenAddress: string, amount: string) => {
    const updated = selectedTokens.map(token =>
      token.address === tokenAddress ? { ...token, amount } : token
    )
    onTokenSelect(updated)
  }

  const getTotalUSDValue = () => {
    // Calculate total USD value using real prices
    return selectedTokens.reduce((total, token) => {
      const amount = parseFloat(token.amount || '0')
      const price = getPrice(token.address)
      return total + (amount * price)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Search and Price Refresh */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
          <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        
        {/* Price Refresh Button */}
        <button
          onClick={refreshPrices}
          disabled={pricesLoading}
          className="px-4 py-2 bg-rootstock-orange text-white rounded-lg hover:bg-rootstock-orange-dark transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Refresh token prices"
        >
          <RefreshCw className={`w-4 h-4 ${pricesLoading ? 'animate-spin' : ''}`} />
          {pricesLoading ? 'Updating...' : 'Refresh Prices'}
        </button>
      </div>

      {/* Price Error */}
      {pricesError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">Price fetch error: {pricesError}</p>
        </div>
      )}

      {/* Available Tokens */}
      <div className="grid gap-4">
        <h3 className="font-semibold text-gray-700">Available Tokens</h3>
        {!address && (
          <div className="text-center py-8 text-gray-500">
            <p>Connect your wallet to see token balances</p>
          </div>
        )}
        {address && (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredTokens.map((token) => {
              const isSelected = selectedTokens.some(t => t.address === token.address)
              const selectedToken = selectedTokens.find(t => t.address === token.address)

              return (
                <TokenCard
                  key={token.address}
                  token={token}
                  isSelected={isSelected}
                  selectedToken={selectedToken}
                  onToggle={() => handleTokenToggle(token)}
                  onAmountChange={(amount) => handleAmountChange(token.address, amount)}
                  getPrice={getPrice}
                  formatValue={formatValue}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Tokens Summary */}
      {selectedTokens.length > 0 && (
        <div className="card-gradient rounded-xl p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Selected Tokens Summary</h3>
          <div className="space-y-3">
            {selectedTokens.map((token) => (
              <div key={token.address} className="flex justify-between items-center">
                <span className="font-medium">{token.symbol}</span>
                <span className="text-gray-600">
                  {token.amount || '0'} {token.symbol}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between items-center font-semibold">
              <span>Total Value (Est.)</span>
              <span className="text-rootstock-orange font-bold">${getTotalUSDValue().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

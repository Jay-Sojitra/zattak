import React, { useState, useMemo } from 'react'
import { Plus, Minus, Coins, Copy, Check, RefreshCw, Filter } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import { formatUnits, getAddress } from 'viem'
import { getFeaturedTokens, searchTokens, AVAILABLE_TAGS, getTagInfo, type Token } from '../constants/tokens'
import { useTokenPrices } from '../hooks/useTokenPrices'
import type { SelectedToken } from '../types'

interface TokenSelectorProps {
  onTokenSelect: (tokens: SelectedToken[]) => void
  selectedTokens: SelectedToken[]
}

// Custom hook to fetch token balance
function useTokenBalance(tokenAddress: string, decimals: number, symbol: string) {
  const { address, isConnected, chain } = useAccount()

  // Convert to checksummed address using viem's getAddress()
  const checksummedTokenAddress = React.useMemo(() => {
    try {
      return getAddress(tokenAddress)
    } catch (error) {
      console.error(`[TokenBalance] Invalid address format for ${symbol}:`, tokenAddress, error)
      return tokenAddress as `0x${string}`
    }
  }, [tokenAddress, symbol])

  // Add detailed logging
  React.useEffect(() => {
    console.log(`[TokenBalance Debug] ${symbol}:`, {
      originalAddress: tokenAddress,
      checksummedAddress: checksummedTokenAddress,
      userAddress: address,
      isConnected,
      chainId: chain?.id,
      chainName: chain?.name,
      decimals
    })
  }, [tokenAddress, checksummedTokenAddress, address, isConnected, chain, decimals, symbol])

  // All tokens are ERC20 tokens
  const { data: balance, isLoading, error, isError } = useBalance({
    address: address,
    token: checksummedTokenAddress,
  })

  // Log balance fetch results
  React.useEffect(() => {
    if (address && tokenAddress) {
      if (isLoading) {
        console.log(`[Balance] ${symbol}: Loading...`)
      } else if (error || isError) {
        console.error(`[Balance ERROR] ${symbol}:`, {
          error,
          isError,
          errorMessage: error?.message,
          tokenAddress,
          userAddress: address,
          chainId: chain?.id
        })
      } else if (balance) {
        console.log(`[Balance SUCCESS] ${symbol}:`, {
          raw: balance.value.toString(),
          formatted: formatUnits(balance.value, decimals),
          decimals,
          symbol: balance.symbol
        })
      } else {
        console.warn(`[Balance] ${symbol}: No data returned (not loading, no error, but no balance)`)
      }
    }
  }, [balance, isLoading, error, isError, address, tokenAddress, symbol, decimals, chain])

  const formattedBalance = balance ? formatUnits(balance.value, decimals) : '0'

  return {
    balance: formattedBalance,
    isLoading,
    raw: balance?.value || 0n,
    error: error || (isError ? new Error('Unknown error fetching balance') : undefined)
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
  token: Token
  isSelected: boolean
  selectedToken?: SelectedToken
  onToggle: () => void
  onAmountChange: (amount: string) => void
  getPrice: (address: string) => number
  formatValue: (address: string, amount: string) => string
}) {
  const { balance, isLoading, error } = useTokenBalance(token.address, token.decimals, token.symbol)
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
        ? 'border-rootstock-orange bg-orange-50 dark:bg-rootstock-orange/10'
        : 'border-gray-200 hover:border-rootstock-orange dark:border-dark-tertiary dark:hover:border-rootstock-orange dark:bg-dark-secondary'
        }`}
      onClick={() => !isSelected && onToggle()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 p-1 dark:bg-dark-tertiary dark:border-dark-tertiary">
            <img
              src={token.logoURI}
              alt={token.symbol}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => {
                // Fallback to a generic token icon
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>'
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 dark:text-dark-text-primary">{token.symbol}</p>
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
            <p className="text-sm text-gray-500 truncate max-w-[150px] dark:text-dark-text-secondary" title={token.name}>{token.name}</p>
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
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-tertiary dark:text-gray-400 dark:hover:bg-dark-tertiary/80'
            : 'bg-rootstock-orange text-white hover:bg-rootstock-orange-dark'
            }`}
        >
          {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Balance</p>
        <div className="font-semibold">
          {isLoading ? (
            displayBalance
          ) : error ? (
            <div>
              <span>0.00</span>
              <p className="text-xs text-red-400 mt-1">Unable to fetch</p>
            </div>
          ) : (
            <div>
              <span>{displayBalance}</span>
              {tokenPrice > 0 && parseFloat(balance) > 0 && (
                <p className="text-sm text-gray-400 mt-1">{balanceUSD}</p>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Amount Input for Selected Tokens */}
      {
        isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-tertiary">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount to swap
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="0.00"
                  value={selectedToken?.amount || ''}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="input-field text-lg dark:bg-dark-tertiary dark:text-white dark:border-dark-tertiary"
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
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 dark:bg-dark-tertiary dark:hover:bg-dark-tertiary/80 dark:text-gray-300"
                disabled={isLoading}
              >
                MAX
              </button>
            </div>
          </div>
        )
      }
    </div >
  )
}

export function TokenSelector({ onTokenSelect, selectedTokens }: TokenSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(true)
  // const { address } = useAccount()

  // Get tokens based on filters
  const availableTokens = useMemo(() => {
    let tokens: Token[]

    // Start with featured or all tokens
    if (showFeaturedOnly) {
      tokens = getFeaturedTokens()
    } else {
      tokens = searchTokens('') // Get all tokens
    }

    // Filter by tag if selected
    if (selectedTag) {
      tokens = tokens.filter(token => token.tags.includes(selectedTag))
    }

    // Filter by search term (symbol, name, or address)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase().trim()
      tokens = tokens.filter(token =>
        token.symbol.toLowerCase().includes(lowerSearch) ||
        token.name.toLowerCase().includes(lowerSearch) ||
        token.address.toLowerCase().includes(lowerSearch)
      )
    }

    return tokens
  }, [searchTerm, selectedTag, showFeaturedOnly])

  // Get prices for all available tokens
  const tokenAddresses = availableTokens.map(token => token.address)
  const { getPrice, formatValue, refreshPrices, isLoading: pricesLoading, error: pricesError } = useTokenPrices(tokenAddresses)

  const handleTokenToggle = (token: Token) => {
    const isSelected = selectedTokens.some(t => t.address === token.address)

    if (isSelected) {
      // Remove token
      const updated = selectedTokens.filter(t => t.address !== token.address)
      onTokenSelect(updated)
    } else {
      // Add token
      const newToken: SelectedToken = {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoUrl: token.logoURI,
        amount: '',
        balance: '0'
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
    return selectedTokens.reduce((total, token) => {
      const amount = parseFloat(token.amount || '0')
      const price = getPrice(token.address)
      return total + (amount * price)
    }, 0)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTag(null)
    setShowFeaturedOnly(true)
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 dark:bg-dark-tertiary dark:border-dark-tertiary dark:text-white dark:placeholder-gray-500"
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

        {/* Show Featured / All Toggle and Tag Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFeaturedOnly
              ? 'bg-rootstock-orange text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-tertiary dark:text-gray-300 dark:hover:bg-dark-tertiary/80'
              }`}
          >
            {showFeaturedOnly ? 'Showing Featured' : 'Showing All'} ({availableTokens.length} tokens)
          </button>

          {/* Tag Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            {AVAILABLE_TAGS.filter(tag => tag !== 'featured').slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedTag === tag
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-tertiary dark:text-gray-400 dark:hover:bg-dark-tertiary/80'
                  }`}
                title={getTagInfo(tag)?.description}
              >
                {getTagInfo(tag)?.name || tag}
              </button>
            ))}
            {(searchTerm || selectedTag || !showFeaturedOnly) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Price Error */}
      {pricesError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">Price fetch error: {pricesError}</p>
        </div>
      )}

      {/* Available Tokens */}
      <div className="grid gap-4">
        <h3 className="font-semibold text-gray-700 dark:text-dark-text-primary">Available Tokens</h3>

        {availableTokens.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No tokens found matching your filters</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-rootstock-orange hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {availableTokens.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {availableTokens.map((token) => {
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
        <div className="card-gradient rounded-xl p-6 dark:from-dark-secondary dark:to-black">
          <h3 className="font-semibold text-gray-700 mb-4 dark:text-white">Selected Tokens Summary</h3>
          <div className="space-y-3">
            {selectedTokens.map((token) => (
              <div key={token.address} className="flex justify-between items-center">
                <span className="font-medium dark:text-gray-200">{token.symbol}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {token.amount || '0'} {token.symbol}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between items-center font-semibold dark:border-white/10">
              <span className="dark:text-gray-300">Total Value (Est.)</span>
              <span className="text-rootstock-orange font-bold">${getTotalUSDValue().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

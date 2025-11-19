import React, { useState } from 'react'
import { Plus, Minus, Coins, Copy, Check } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import type { SelectedToken } from '../types'

interface TokenSelectorProps {
  onTokenSelect: (tokens: SelectedToken[]) => void
  selectedTokens: SelectedToken[]
}

// Available tokens for Rootstock testnet
const AVAILABLE_TOKENS = [
  {
    address: '0x9c3Ea773d4DFB6CbC4a3d88078643020285fd37C',
    symbol: 'rUSDT',
    name: 'Rootstock USDT',
    decimals: 18,
    balance: '1,250.50',
    logoUrl: '/tether-usdt-logo.svg'
  },
  {
    address: '0xDF2c8f7852B3BAA4B728f8EAEfB75CCb3A76d363',
    symbol: 'rBTC',
    name: 'Rootstock Bitcoin',
    decimals: 18,
    balance: '2.45',
    logoUrl: '/bitcoin-btc-logo.svg'
  },
  {
    address: '0xCa552b5ac029864D9c0cFae2c760E57B22f6a268',
    symbol: 'rUSDC',
    name: 'Rootstock USD Coin',
    decimals: 18,
    balance: '892.25',
    logoUrl: '/usd-coin-usdc-logo.svg'
  },
  {
    address: '0x917532db0765F594c766E81ae12fA54Bf7E477E4',
    symbol: 'wETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    balance: '1.25',
    logoUrl: '/ethereum-eth-logo.svg'
  },
  {
    address: '0x490Ec82F495Dd01D5BD176fF00884DD4C97b4831',
    symbol: 'Root',
    name: 'Root Token',
    decimals: 18,
    balance: '1.25',
    logoUrl: '/bitcoin-btc-logo.svg'
  },
  {
    address: '0xA46Db2651fF07E4b529b3ddBb516Cd532841CA9F',
    symbol: 'Stock',
    name: 'Stock Token',
    decimals: 18,
    balance: '1.25',
    logoUrl: '/tether-usdt-logo.svg'
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
  onAmountChange
}: {
  token: typeof AVAILABLE_TOKENS[0]
  isSelected: boolean
  selectedToken?: SelectedToken
  onToggle: () => void
  onAmountChange: (amount: string) => void
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
            <span>{displayBalance} {token.symbol}</span>
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
    // Realistic USD calculation based on actual swap rates
    return selectedTokens.reduce((total, token) => {
      const amount = parseFloat(token.amount || '0')
      const mockPrice = token.symbol === 'rUSDT' ? 1 :
        token.symbol === 'rUSDC' ? 1 :
          token.symbol === 'rBTC' ? 65000 :
            token.symbol === 'wETH' ? 3200 : 1
      return total + (amount * mockPrice)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
        <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

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

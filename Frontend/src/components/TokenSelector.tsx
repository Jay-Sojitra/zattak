import { useState } from 'react'
import { Plus, Minus, Coins } from 'lucide-react'
import { SelectedToken } from '../types'

interface TokenSelectorProps {
  onTokenSelect: (tokens: SelectedToken[]) => void
  selectedTokens: SelectedToken[]
}

// Mock token data for Rootstock testnet
const AVAILABLE_TOKENS = [
  {
    address: '0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96',
    symbol: 'rUSDT',
    name: 'Rootstock USDT',
    decimals: 18,
    balance: '1,250.50',
    logoUrl: '/tokens/rusdt.png'
  },
  {
    address: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    balance: '892.25',
    logoUrl: '/tokens/usdt.png'
  },
  {
    address: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5',
    symbol: 'tRIF',
    name: 'Test RIF Token',
    decimals: 18,
    balance: '15,420.75',
    logoUrl: '/tokens/rif.png'
  },
  {
    address: '0x1bda44fda023f2af8280a16fd1b01d1a493ba6c4',
    symbol: 'DOC',
    name: 'Dollar on Chain',
    decimals: 18,
    balance: '500.00',
    logoUrl: '/tokens/doc.png'
  }
]

export function TokenSelector({ onTokenSelect, selectedTokens }: TokenSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

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
      // Add token
      const newToken: SelectedToken = {
        ...token,
        amount: ''
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
    // Mock USD calculation - would be real in production
    return selectedTokens.reduce((total, token) => {
      const amount = parseFloat(token.amount || '0')
      const mockPrice = token.symbol === 'USDT' || token.symbol === 'rUSDT' ? 1 : 
                       token.symbol === 'tRIF' ? 0.25 : 1
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
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredTokens.map((token) => {
            const isSelected = selectedTokens.some(t => t.address === token.address)
            const selectedToken = selectedTokens.find(t => t.address === token.address)
            
            return (
              <div
                key={token.address}
                className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-rif-primary bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => !isSelected && handleTokenToggle(token)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-rootstock-orange to-rif-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{token.symbol[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{token.name}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTokenToggle(token)
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      isSelected 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="font-semibold">{token.balance} {token.symbol}</p>
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
                        onChange={(e) => handleAmountChange(token.address, e.target.value)}
                        className="input-field text-lg"
                        step="0.01"
                        min="0"
                        max={parseFloat(token.balance.replace(/,/g, ''))}
                      />
                      <button
                        onClick={() => handleAmountChange(token.address, token.balance.replace(/,/g, ''))}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
              <span className="text-rif-primary">${getTotalUSDValue().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

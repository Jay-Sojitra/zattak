import { useState } from 'react'
import { ArrowDownUp, Zap, Shield, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useSwapQuotes } from '../hooks/useSwapQuotes'
import { useTokenPrices } from '../hooks/useTokenPrices'
import { TOKENS, CONTRACTS } from '../constants/tokens'
import type { SelectedToken } from '../types'

interface SwapDepositInterfaceProps {
  selectedTokens: SelectedToken[]
  onSwapAndDeposit: () => void
  isLoading: boolean
  hash?: `0x${string}`
  isConfirmed?: boolean
  error?: string | null
  onClearError?: () => void
  needsApprovals?: boolean
  batchId?: string | null
  approvalStep?: number
  totalApprovals?: number
  isEIP5792?: boolean
  chainId?: number
}

export function SwapDepositInterface({ 
  selectedTokens, 
  onSwapAndDeposit, 
  isLoading,
  hash,
  isConfirmed,
  error,
  onClearError,
  needsApprovals,
  batchId,
  approvalStep = 0,
  totalApprovals = 0,
  isEIP5792 = false,
  chainId = 31
}: SwapDepositInterfaceProps) {
  const [slippage, setSlippage] = useState('0.5')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { address } = useAccount()
  
  // Get swap quotes for selected tokens
  const { 
    quotes, 
    totalRIF, 
    totalPriceImpact, 
    isLoading: quotesLoading, 
    error: quotesError,
    refreshQuotes,
    getQuoteForToken
  } = useSwapQuotes(selectedTokens, address)
  
  // Get real prices for all tokens including RIF
  const allTokenAddresses = [
    TOKENS.RUSDT.address,
    TOKENS.USDT.address,
    TOKENS.RBTC.address,
    TOKENS.WETH.address,
    CONTRACTS.RIF_TOKEN
  ]
  const { getPrice } = useTokenPrices(allTokenAddresses)

  const calculateEstimatedRIF = () => {
    // Use real swap quotes if available and valid
    const hasValidQuotes = quotes.length > 0 && !quotesLoading && totalRIF !== '0' && parseFloat(totalRIF) > 0;
    
    if (hasValidQuotes) {
      console.log('Using real quotes:', totalRIF);
      return parseFloat(totalRIF);
    }
    
    // Fallback calculation when quotes are loading or failed
    console.log('Using fallback calculation, quotes state:', {
      quotesLength: quotes.length,
      quotesLoading,
      totalRIF,
      quotesError
    });
    
    return selectedTokens.reduce((total, token) => {
      const amount = parseFloat(token.amount || '0')
      
      // Use real prices to calculate RIF equivalent
      const tokenPrice = getPrice(token.address) || 0
      const rifPrice = getPrice(CONTRACTS.RIF_TOKEN) || 0.10 // fallback RIF price
      
      const usdValue = amount * tokenPrice
      const rifAmount = rifPrice > 0 ? usdValue / rifPrice : 0
      
      return total + rifAmount
    }, 0)
  }

  const calculateGasFee = () => {
    // Mock gas calculation
    return (selectedTokens.length * 0.002).toFixed(4)
  }

  const hasValidAmounts = selectedTokens.every(token => 
    token.amount && parseFloat(token.amount) > 0
  )

  const estimatedRIF = calculateEstimatedRIF()
  const estimatedAPY = 12.5 // Mock APY

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">
          Swap & Stake Summary
        </h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-rootstock-orange hover:text-rootstock-orange-dark transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Swap Preview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Tokens */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            You're Swapping
          </h3>
          {selectedTokens.map((token) => (
            <div key={token.address} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 p-1">
                  <img 
                    src={token.logoUrl} 
                    alt={token.symbol} 
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </div>
                <div>
                  <p className="font-medium">{token.symbol}</p>
                  <p className="text-sm text-gray-500">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{token.amount || '0'}</p>
                <p className="text-sm text-gray-500">≈ ${(() => {
                  const amount = parseFloat(token.amount || '0')
                  const price = getPrice(token.address) || 0
                  return (amount * price).toFixed(2)
                })()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Output */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            You'll Receive & Stake
          </h3>
          <div className="p-6 card-gradient rounded-xl border-2 border-rootstock-orange/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rootstock-orange rounded-full flex items-center justify-center">
                <span className="text-white font-bold">RIF</span>
              </div>
              <div>
                <p className="font-semibold text-lg">RIF Token</p>
                <p className="text-sm text-gray-500">Automatically staked</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-rootstock-orange">
                  {estimatedRIF.toFixed(2)} RIF
                </p>
                {quotesLoading && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              <p className="text-sm text-gray-500">
                ≈ ${(estimatedRIF * (getPrice(CONTRACTS.RIF_TOKEN) || 0.10)).toFixed(2)}
                {quotes.length > 0 && !quotesLoading && parseFloat(totalRIF) > 0 ? (
                  <span className="text-green-600 ml-1">• Real-time</span>
                ) : quotesError ? (
                  <span className="text-red-500 ml-1">• Quote failed</span>
                ) : quotesLoading ? (
                  <span className="text-blue-500 ml-1">• Loading...</span>
                ) : (
                  <span className="text-amber-600 ml-1">• Estimated</span>
                )}
              </p>
              {totalPriceImpact > 0 && (
                <p className="text-xs text-amber-600">
                  Price Impact: {totalPriceImpact.toFixed(2)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Quote Details */}
      {selectedTokens.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Real-time Swap Quotes
            </h4>
            <button
              onClick={refreshQuotes}
              disabled={quotesLoading}
              className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
              title="Refresh quotes"
            >
              <RefreshCw className={`w-4 h-4 ${quotesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {quotesError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              Quote Error: {quotesError}
            </div>
          )}

          <div className="space-y-2">
            {selectedTokens.map((token) => {
              const quote = getQuoteForToken(token.address);
              const amount = parseFloat(token.amount || '0');
              
              if (amount <= 0) return null;

              return (
                <div key={token.address} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {token.amount} {token.symbol} →
                  </span>
                  <span className="font-medium text-blue-700">
                    {quotesLoading ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Loading...
                      </span>
                    ) : quote?.success ? (
                      `${parseFloat(quote.amountOutFormatted).toFixed(4)} RIF`
                    ) : quote?.error ? (
                      <span className="text-red-500" title={quote.error}>Quote failed</span>
                    ) : (
                      <span className="text-gray-400">No quote</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {quotes.length > 0 && !quotesLoading && (
            <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center font-semibold text-blue-800">
              <span>Total Expected:</span>
              <span>{totalRIF} RIF</span>
            </div>
          )}
        </div>
      )}

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-4">
          <h4 className="font-medium text-gray-700">Advanced Settings</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      slippage === value
                        ? 'bg-rootstock-orange text-white'
                        : 'bg-white border border-gray-200 hover:border-rootstock-orange'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Gas Fee
              </label>
              <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-200">
                {calculateGasFee()} RBTC (≈ ${(parseFloat(calculateGasFee()) * (getPrice(TOKENS.RBTC.address) || 65000)).toFixed(2)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Staking Info */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Staking Benefits
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-green-700">APY</p>
            <p className="text-green-600">{estimatedAPY}%</p>
          </div>
          <div>
            <p className="font-medium text-green-700">Lock Period</p>
            <p className="text-green-600">Flexible</p>
          </div>
          <div>
            <p className="font-medium text-green-700">Rewards</p>
            <p className="text-green-600">Daily</p>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Rate</span>
          <span>1 rUSDT ≈ 17.11 RIF</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Slippage Tolerance</span>
          <span>{slippage}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Estimated Gas</span>
          <span>{calculateGasFee()} RBTC</span>
        </div>
        <div className="flex justify-between text-sm font-medium pt-2 border-t">
          <span>You'll stake</span>
          <span className="text-rootstock-orange font-bold">{estimatedRIF.toFixed(2)} tRIF</span>
        </div>
      </div>

          {/* Chain-specific Transaction Info */}
          <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <p className="text-sm font-medium text-blue-700">
                {chainId === 84532 ? '🚀 Base Sepolia - EIP-5792 Batch' : '⚡ Rootstock Testnet - Traditional'}
              </p>
            </div>
            <p className="text-xs mt-1 text-blue-600">
              {chainId === 84532 
                ? 'Checking allowances... Only needed approvals will be batched'
                : needsApprovals 
                  ? `${totalApprovals} approval transaction(s) needed + 1 main transaction`
                  : 'Checking allowances... May skip approvals if sufficient'
              }
            </p>
          </div>

          {/* Approval Progress for Rootstock */}
          {!isEIP5792 && needsApprovals && approvalStep > 0 && (
            <div className="p-4 rounded-xl border bg-yellow-50 border-yellow-200 overflow-hidden">
              {(() => {
                // Clamp the displayed step so it never exceeds total steps (approvals + main tx)
                const totalSteps = (totalApprovals ?? 0) + 1
                const displayStep = Math.min(approvalStep ?? 0, totalSteps)

                return (
                  <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-yellow-700">
                  Approval Progress
                </p>
                <span className="text-xs text-yellow-600">
                      {displayStep}/{totalSteps}
                </span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(displayStep / totalSteps) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs mt-2 text-yellow-600">
                {approvalStep <= totalApprovals 
                  ? `Approving token ${approvalStep}/${totalApprovals}...`
                  : 'Executing main transaction...'
                }
              </p>
                  </>
                )
              })()}
            </div>
          )}

          {/* Transaction Status */}
          {error && (
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700">Transaction Failed</p>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </div>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {(hash || batchId) && !isConfirmed && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm text-blue-700">
                <p>{batchId ? 'Batch transaction submitted!' : 'Transaction submitted!'}</p>
                {hash && (
                  <p className="font-mono">Hash: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
                )}
                {batchId && (
                  <p className="font-mono">Batch ID: {batchId.slice(0, 10)}...{batchId.slice(-8)}</p>
                )}
              </div>
            </div>
          )}


      {/* Warning */}
      {!hasValidAmounts && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-700">
            Please enter valid amounts for all selected tokens before proceeding.
          </p>
        </div>
      )}

          {/* Action Button */}
          <button
            onClick={onSwapAndDeposit}
            disabled={!hasValidAmounts || isLoading}
            className="w-full btn-primary text-xl py-4 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {batchId ? 'Confirming Batch Transaction...' : 'Preparing Batch Transaction...'}
              </>
            ) : isConfirmed ? (
              <>
                <span className="text-lg">✓</span>
                {batchId ? 'Batch Transaction Confirmed!' : 'Transaction Confirmed!'}
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                {chainId === 84532
                  ? `Batch: Approve & Swap & Stake ${estimatedRIF.toFixed(2)} tRIF`
                  : needsApprovals 
                    ? `Approve & Swap & Stake ${estimatedRIF.toFixed(2)} tRIF`
                    : `Swap & Stake ${estimatedRIF.toFixed(2)} tRIF`
                }
              </>
            )}
          </button>

          {/* Transaction Steps */}
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">
              {chainId === 84532 ? 'This batch transaction will:' : 'These transactions will:'}
            </p>
            <div className="flex justify-center gap-6 flex-wrap">
              {needsApprovals && <span>1. Approve tokens</span>}
              <span>{needsApprovals ? '2.' : '1.'} Swap to tRIF</span>
              <span>{needsApprovals ? '3.' : '2.'} Auto-stake</span>
            </div>
            <p className={`text-xs mt-2 ${chainId === 84532 ? 'text-green-600' : 'text-blue-600'}`}>
              {chainId === 84532 
                ? '✨ All steps executed atomically in one transaction'
                : '⚡ Multiple transactions for maximum compatibility'
              }
            </p>
          </div>
    </div>
  )
}

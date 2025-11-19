import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { WalletConnect } from './components/WalletConnect'
import { TokenSelector } from './components/TokenSelector'
import { SwapDepositInterface } from './components/SwapDepositInterface'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { StatsSection } from './components/StatsSection'
import { useBatchTransaction } from './hooks/useBatchTransaction'
import type { SelectedToken } from './types'

function App() {
  const { isConnected } = useAccount()
  const [selectedTokens, setSelectedTokens] = useState<SelectedToken[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const {
    isLoading,
    batchId,
    hash,
    error,
    needsApprovals,
    approvalStep,
    totalApprovals,
    isConfirmed,
    chainId,
    shouldUseEIP5792,
    executeBatchTransaction,
    reset
  } = useBatchTransaction()

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccessModal(true)
    }
  }, [isConfirmed])

  const handleTokenSelect = (tokens: SelectedToken[]) => {
    setSelectedTokens(tokens)
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    setSelectedTokens([]) // Clear selected tokens
    reset() // Reset batch transaction state
  }

  const handleClearError = () => {
    reset() // Reset batch transaction state
  }

  const handleSwapAndDeposit = async () => {
    if (!selectedTokens.length) return

    try {
      await executeBatchTransaction(selectedTokens)
    } catch (error) {
      console.error('Error executing batch transaction:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-rootstock-orange mb-4">
            RIF Staking Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Swap any token to tRIF and stake in one click. Maximize your returns on Rootstock testnet 
            with our seamless multi-token swapping and staking solution.
          </p>
          <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Rootstock Testnet
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              SushiSwap Integration
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Auto-Staking
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <StatsSection />

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Wallet Connection */}
          <div className="card">
            <WalletConnect />
          </div>

          {/* Token Selection */}
          {isConnected && (
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Select Tokens to Swap & Stake
              </h2>
              <TokenSelector 
                onTokenSelect={handleTokenSelect}
                selectedTokens={selectedTokens}
              />
      </div>
          )}

          {/* Swap and Deposit Interface */}
          {isConnected && selectedTokens.length > 0 && (
      <div className="card">
                  <SwapDepositInterface 
                    selectedTokens={selectedTokens}
                    onSwapAndDeposit={handleSwapAndDeposit}
                    isLoading={isLoading}
                    hash={hash || (batchId as `0x${string}` | undefined)}
                    isConfirmed={isConfirmed}
                    error={error}
                    onClearError={handleClearError}
                    needsApprovals={needsApprovals}
                    batchId={batchId}
                    approvalStep={approvalStep}
                    totalApprovals={totalApprovals}
                    isEIP5792={shouldUseEIP5792}
                    chainId={chainId}
                  />
            </div>
          )}
        </div>

            {/* Feature Highlights */}
            <div className="max-w-6xl mx-auto mt-16">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="card-gradient text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Multi-Token Swap</h3>
                  <p className="text-gray-600">
                    Support for multiple tokens in a single transaction. Swap USDT, rUSDT, and more to tRIF.
                  </p>
                </div>
                
                <div className="card-gradient text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">One-Click Staking</h3>
                  <p className="text-gray-600">
                    Automatically stake your swapped tRIF tokens in the RIF staking contract with optimal gas efficiency.
                  </p>
                </div>
                
                <div className="card-gradient text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Maximize Returns</h3>
                  <p className="text-gray-600">
                    Earn staking rewards while participating in the Rootstock ecosystem. Secure and transparent.
                  </p>
                </div>
              </div>
            </div>
      </main>

      <Footer />

          {/* Success Modal */}
          {showSuccessModal && (batchId || hash) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
        </button>

            {/* Success content */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Transaction Successful! 🎉
              </h3>
              
              <p className="text-gray-600 mb-6">
                Your tokens have been swapped and staked successfully!
              </p>

                  {/* Transaction hash */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-2">
                      {batchId ? 'Batch Transaction ID:' : 'Transaction Hash:'}
                    </p>
                    <p className="font-mono text-xs text-gray-700 break-all">
                      {batchId || hash}
                    </p>
                  </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`${chainId === 84532 
                    ? `https://sepolia.basescan.org/tx/${batchId || hash}` 
                    : `https://explorer.testnet.rootstock.io/tx/${batchId || hash}`
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-primary text-center py-3 px-4 text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Explorer
                </a>
                
                <button
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary py-3 px-4 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

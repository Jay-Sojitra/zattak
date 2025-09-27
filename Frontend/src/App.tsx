import { useState } from 'react'
import { useAccount } from 'wagmi'
import { WalletConnect } from './components/WalletConnect'
import { TokenSelector } from './components/TokenSelector'
import { SwapDepositInterface } from './components/SwapDepositInterface'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { StatsSection } from './components/StatsSection'
import type { SelectedToken } from './types'

function App() {
  const { isConnected } = useAccount()
  const [selectedTokens, setSelectedTokens] = useState<SelectedToken[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleTokenSelect = (tokens: SelectedToken[]) => {
    setSelectedTokens(tokens)
  }

  const handleSwapAndDeposit = async () => {
    setIsLoading(true)
    // This will be implemented when we integrate the contract
    try {
      console.log('Swapping and depositing tokens:', selectedTokens)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      alert('Swap and Deposit successful! (Demo)')
    } catch (error) {
      console.error('Error:', error)
      alert('Transaction failed!')
    } finally {
      setIsLoading(false)
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
              />
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-gradient text-center">
              <div className="w-16 h-16 bg-rootstock-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Token Swap</h3>
              <p className="text-gray-600">
                Support for multiple tokens in a single transaction. Swap USDT, rUSDT, and more to tRIF.
              </p>
            </div>
            
            <div className="card-gradient text-center">
              <div className="w-16 h-16 bg-rootstock-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">One-Click Staking</h3>
              <p className="text-gray-600">
                Automatically stake your swapped tRIF tokens in the RIF staking contract with optimal gas efficiency.
              </p>
            </div>
            
            <div className="card-gradient text-center">
              <div className="w-16 h-16 bg-rootstock-orange rounded-full flex items-center justify-center mx-auto mb-4">
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
    </div>
  )
}

export default App
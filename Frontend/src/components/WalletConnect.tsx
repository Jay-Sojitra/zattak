import { useState } from 'react'
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react'

interface WalletConnectProps {
  onConnect: (connected: boolean) => void
  isConnected: boolean
}

export function WalletConnect({ onConnect, isConnected }: WalletConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [address, setAddress] = useState('')

  const handleConnect = async () => {
    setIsLoading(true)
    
    try {
      // Simulate wallet connection (will be replaced with actual wallet integration)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock address for demo
      const mockAddress = '0x742d35Cc6432C672B38fD5FC5e5fD0d5e7d82B8D'
      setAddress(mockAddress)
      onConnect(true)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setAddress('')
    onConnect(false)
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-semibold text-green-800">Wallet Connected</p>
            <p className="text-sm text-green-600 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="btn-secondary text-sm"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-rootstock-orange to-rif-primary rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2 text-gray-800">
        Connect Your Wallet
      </h2>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Connect your wallet to start swapping tokens and staking tRIF on Rootstock testnet.
      </p>

      {/* Network Warning */}
      <div className="flex items-center gap-2 justify-center mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <p className="text-sm text-amber-700">
          Make sure you're connected to Rootstock Testnet
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="btn-primary text-lg px-8 py-4"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Connecting...
          </div>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {/* Supported Wallets */}
      <div className="mt-6 text-sm text-gray-500">
        <p className="mb-2">Supported wallets:</p>
        <div className="flex justify-center gap-4">
          <span className="px-3 py-1 bg-gray-100 rounded-full">MetaMask</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full">WalletConnect</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full">Coinbase</span>
        </div>
      </div>
    </div>
  )
}

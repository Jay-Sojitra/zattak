import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AlertCircle } from 'lucide-react'

export function WalletConnect() {
  return (
    <div className="text-center">
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

      {/* RainbowKit Connect Button */}
      <div className="flex justify-center">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted
            const connected = ready && account && chain

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="btn-primary text-lg px-8 py-4"
                      >
                        Connect Wallet
                      </button>
                    )
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl"
                      >
                        Wrong network
                      </button>
                    )
                  }

                  return (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">
                            {account.displayName}
                          </p>
                          <p className="text-sm text-green-600">
                            {chain.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="btn-secondary text-sm"
                      >
                        Account
                      </button>
                    </div>
                  )
                })()}
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>

      {/* Supported Wallets */}
      <div className="mt-6 text-sm text-gray-500">
        <p className="mb-2">Supported wallets:</p>
        <div className="flex justify-center gap-4">
          <span className="px-3 py-1 bg-gray-100 rounded-full">MetaMask</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full">WalletConnect</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full">Coinbase</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full">Rainbow</span>
        </div>
      </div>
    </div>
  )
}

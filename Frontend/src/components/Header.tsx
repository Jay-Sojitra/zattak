import { Github } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white">
              <img src="/logo_light.jpg" alt="Rootstock Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">RIF Staking</h1>
              <p className="text-xs text-gray-500">Rootstock Testnet</p>
            </div>
          </div>


          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/Jay-Sojitra/zattak"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            
            {/* Network indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Testnet
            </div>

            {/* Connect Button */}
            <div className="hidden md:block">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

import { Github, ExternalLink } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-rootstock-orange to-rif-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">RIF Staking</h1>
              <p className="text-xs text-gray-500">Rootstock Testnet</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href="#"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              How it Works
            </a>
            <a 
              href="#"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              FAQ
            </a>
            <a 
              href="https://testnet.rootstock.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Rootstock Testnet
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

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
          </div>
        </div>
      </div>
    </header>
  )
}

import { Github } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50
                       dark:bg-dark-secondary/95 dark:border-dark-tertiary transition-colors duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-dark-tertiary">
              <img src="/logo_light.jpg" alt="Zattak Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary">Zattak</h1>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Rootstock Mainnet</p>
            </div>
          </div>


          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/Jay-Sojitra/zattak"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-dark-text-secondary dark:hover:text-dark-text-primary transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>

            {/* Theme Toggle */}
            <ThemeToggle />

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

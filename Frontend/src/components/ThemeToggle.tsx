import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-dark-tertiary dark:hover:bg-dark-tertiary/80 
                 transition-all duration-200 group"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 group-hover:text-rootstock-orange transition-colors duration-200" />
            ) : (
                <Sun className="w-5 h-5 text-rootstock-orange group-hover:text-rootstock-orange-light transition-colors duration-200" />
            )}
        </button>
    )
}

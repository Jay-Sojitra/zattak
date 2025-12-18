import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react'

export function StatsSection() {
  // Mock data - would be fetched from APIs in production
  const stats = [
    {
      icon: DollarSign,
      label: 'Total Value Locked',
      value: '$2.4M',
      change: '+12.5%',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Users,
      label: 'Active Stakers',
      value: '1,234',
      change: '+8.2%',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: TrendingUp,
      label: 'Current APY',
      value: '12.5%',
      change: '+0.3%',
      color: 'text-rootstock-orange dark:text-orange-400'
    },
    {
      icon: Zap,
      label: 'Total Swaps',
      value: '5,678',
      change: '+15.7%',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto mb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card group text-center animate-slideUp hover:scale-105 transition-all duration-300 hover:shadow-2xl dark:hover:bg-dark-tertiary/80" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className={`w-14 h-14 rounded-2xl rotate-0 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:rotate-0 ${index === 0 ? 'bg-green-100 dark:bg-green-500/10 dark:ring-1 dark:ring-green-500/50 dark:shadow-[0_0_20px_rgba(74,222,128,0.15)]' :
              index === 1 ? 'bg-blue-100 dark:bg-blue-500/10 dark:ring-1 dark:ring-blue-500/50 dark:shadow-[0_0_20px_rgba(96,165,250,0.15)]' :
                index === 2 ? 'bg-rootstock-orange/10 dark:bg-orange-500/10 dark:ring-1 dark:ring-orange-500/50 dark:shadow-[0_0_20px_rgba(251,146,60,0.15)]' :
                  'bg-orange-100 dark:bg-orange-500/10 dark:ring-1 dark:ring-orange-500/50 dark:shadow-[0_0_20px_rgba(251,146,60,0.15)]'
              }`}>
              <stat.icon className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${stat.color} -rotate-0 group-hover:-rotate-0`} />
            </div>

            <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text-primary mb-1">
              {stat.value}
            </p>

            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
              {stat.label}
            </p>

            <div className={`text-xs font-medium ${stat.color}`}>
              {stat.change} 24h
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react'

export function StatsSection() {
  // Mock data - would be fetched from APIs in production
  const stats = [
    {
      icon: DollarSign,
      label: 'Total Value Locked',
      value: '$2.4M',
      change: '+12.5%',
      color: 'text-green-600'
    },
    {
      icon: Users,
      label: 'Active Stakers',
      value: '1,234',
      change: '+8.2%',
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      label: 'Current APY',
      value: '12.5%',
      change: '+0.3%',
      color: 'text-rootstock-orange'
    },
    {
      icon: Zap,
      label: 'Total Swaps',
      value: '5,678',
      change: '+15.7%',
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto mb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              index === 0 ? 'bg-green-100' :
              index === 1 ? 'bg-blue-100' :
              index === 2 ? 'bg-rootstock-orange/10' :
              'bg-orange-100'
            }`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            
            <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
              {stat.value}
            </p>
            
            <p className="text-sm text-gray-600 mb-2">
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

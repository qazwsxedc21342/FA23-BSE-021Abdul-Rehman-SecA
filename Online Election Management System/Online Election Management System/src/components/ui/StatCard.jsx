import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue', loading = false }) => {
  const colors = {
    blue:   { bg: 'bg-primary-50',  icon: 'bg-primary-100  text-primary-700', text: 'text-primary-700' },
    teal:   { bg: 'bg-teal-50',     icon: 'bg-teal-100     text-teal-700',    text: 'text-teal-700' },
    green:  { bg: 'bg-green-50',    icon: 'bg-green-100    text-green-700',   text: 'text-green-700' },
    purple: { bg: 'bg-purple-50',   icon: 'bg-purple-100   text-purple-700',  text: 'text-purple-700' },
    orange: { bg: 'bg-orange-50',   icon: 'bg-orange-100   text-orange-700',  text: 'text-orange-700' },
    yellow: { bg: 'bg-yellow-50',   icon: 'bg-yellow-100   text-yellow-700',  text: 'text-yellow-700' },
    red:    { bg: 'bg-red-50',      icon: 'bg-red-100      text-red-700',     text: 'text-red-700' },
  }
  const c = colors[color] || colors.blue

  if (loading) return (
    <div className="card p-6 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="w-11 h-11 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-20" />
      <div className="h-3 bg-slate-200 rounded w-24" />
    </div>
  )

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card card-hover p-6 cursor-default"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-display font-bold text-slate-800 mb-2">
        {value}
      </div>
      {trendValue !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trend === 'up'   ? 'text-green-600' :
          trend === 'down' ? 'text-red-600' : 'text-slate-500'
        }`}>
          {trend === 'up'   ? <TrendingUp className="w-3 h-3" /> :
           trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
                              <Minus className="w-3 h-3" />}
          <span>{trendValue}</span>
        </div>
      )}
    </motion.div>
  )
}

export default StatCard

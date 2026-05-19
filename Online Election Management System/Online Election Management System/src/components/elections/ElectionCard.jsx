import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Users, Clock, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import CountdownTimer from '../ui/CountdownTimer'

const statusConfig = {
  active:    { label: 'Active',     cls: 'status-active',    dot: 'bg-green-500' },
  upcoming:  { label: 'Upcoming',   cls: 'status-upcoming',  dot: 'bg-blue-500' },
  completed: { label: 'Completed',  cls: 'status-completed', dot: 'bg-slate-400' },
  draft:     { label: 'Draft',      cls: 'status-draft',     dot: 'bg-yellow-500' },
}

const categoryColors = {
  'Student Council': 'badge-blue',
  'Corporate':       'badge-teal',
  'Community':       'badge-green',
  'Government':      'badge-purple',
  'Other':           'badge-gray',
}

const ElectionCard = ({ election, index = 0 }) => {
  const status = statusConfig[election.status] || statusConfig.upcoming
  const catColor = categoryColors[election.category] || 'badge-gray'
  const turnout = election.max_voters
    ? Math.round(((election.vote_count || 0) / election.max_voters) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      className="card card-hover overflow-hidden group"
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${
        election.status === 'active'    ? 'bg-gradient-to-r from-green-400 to-teal-500' :
        election.status === 'upcoming'  ? 'bg-gradient-to-r from-blue-400 to-primary-600' :
        election.status === 'completed' ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                          'bg-gradient-to-r from-yellow-400 to-orange-400'
      }`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={status.cls}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                {status.label}
              </span>
              <span className={catColor}>{election.category || 'General'}</span>
            </div>
            <h3 className="font-display font-semibold text-slate-800 text-lg leading-tight group-hover:text-primary-700 transition-colors line-clamp-2">
              {election.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        {election.description && (
          <p className="text-slate-500 text-sm mb-4 line-clamp-2">{election.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {election.vote_count || 0}
            {election.max_voters ? ` / ${election.max_voters}` : ''} votes
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {format(new Date(election.start_at), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Turnout bar */}
        {election.max_voters > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Voter turnout</span>
              <span className="font-medium">{turnout}%</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill bg-gradient-to-r from-primary-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${turnout}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </div>
          </div>
        )}

        {/* Countdown */}
        {election.status === 'active' && (
          <div className="bg-green-50 rounded-xl p-3 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-xs text-green-700 font-medium">Ends in: </span>
            <CountdownTimer targetDate={election.end_at} compact className="text-green-700 text-xs" />
          </div>
        )}
        {election.status === 'upcoming' && (
          <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs text-blue-700 font-medium">Starts in: </span>
            <CountdownTimer targetDate={election.start_at} compact className="text-blue-700 text-xs" />
          </div>
        )}

        {/* CTA */}
        <Link
          to={`/elections/${election.id}`}
          className="flex items-center justify-between w-full btn-primary text-sm px-4 py-2.5 group/btn"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  )
}

export default ElectionCard

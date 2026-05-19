import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchPlatformStats, fetchVisibleElections, getErrorMessage } from '../../lib/electionData'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import ElectionCard from '../../components/elections/ElectionCard'
import CountdownTimer from '../../components/ui/CountdownTimer'
import { CardSkeleton } from '../../components/ui/Skeleton'
import {
  Vote, Shield, BarChart3, Users, ArrowRight,
  Search, Filter, CheckCircle, Lock, Globe, Zap
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const FILTERS = ['All', 'Active', 'Upcoming', 'Completed']

const features = [
  { icon: Shield,    title: 'Bank-Grade Security',   desc: 'End-to-end encryption and anonymous voting ensures your ballot is always private.' },
  { icon: Vote,      title: 'Easy Voting',            desc: 'Cast your vote in seconds with our intuitive interface designed for everyone.' },
  { icon: BarChart3, title: 'Real-Time Results',      desc: 'Watch results update live as votes are counted with full transparency.' },
  { icon: Lock,      title: 'Tamper-Proof Records',   desc: 'Every action is logged in an immutable audit trail for full accountability.' },
  { icon: Globe,     title: 'Vote From Anywhere',     desc: 'Participate in elections from any device, anywhere in the world.' },
  { icon: Zap,       title: 'Instant Notifications',  desc: 'Get notified about election updates, results, and your secret voter ID.' },
]

const statsData = [
  { name: 'Jan', elections: 4 }, { name: 'Feb', elections: 7 },
  { name: 'Mar', elections: 5 }, { name: 'Apr', elections: 9 },
  { name: 'May', elections: 12 },{ name: 'Jun', elections: 8 },
]

const LandingPage = () => {
  const [elections, setElections] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('All')
  const [search, setSearch]       = useState('')
  const [stats, setStats]         = useState({ total: 0, active: 0, voters: 0, votes: 0 })
  const [error, setError]         = useState('')

  useEffect(() => {
    fetchElections()
    fetchStats()
  }, [])

  const fetchElections = async () => {
    setLoading(true)
    setError('')
    try {
      setElections(await fetchVisibleElections({ limit: 12, orderBy: 'created_at' }))
    } catch (error) {
      console.error('Failed to fetch elections:', error)
      setError(getErrorMessage(error, 'Failed to load elections.'))
      setElections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStats(await fetchPlatformStats())
    } catch (error) {
      console.warn('Stats could not be loaded:', error)
      setStats({ total: 0, active: 0, voters: 0, votes: 0 })
    }
  }

  const filtered = elections.filter(el => {
    const matchFilter = filter === 'All' || el.status === filter.toLowerCase()
    const matchSearch = el.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="bg-hero relative overflow-hidden min-h-screen flex items-center">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                  Secure · Transparent · Democratic
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="font-display text-5xl sm:text-6xl font-bold text-white leading-tight mb-6"
              >
                Vote Securely,{' '}
                <span className="text-gradient-light">Anywhere,</span>{' '}
                Anytime.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-blue-100 text-lg leading-relaxed mb-8 max-w-lg"
              >
                VoteSecure is a state-of-the-art online election platform with end-to-end encryption, anonymous ballots, and real-time transparent results.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/elections" className="btn-teal flex items-center gap-2 py-3.5 px-7 text-base">
                  View Elections <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/register" className="flex items-center gap-2 py-3.5 px-7 rounded-xl border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-colors text-base">
                  Register Now
                </Link>
              </motion.div>
            </div>

            {/* Stats cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { label: 'Total Elections', value: stats.total, icon: Vote },
                { label: 'Active Now',       value: stats.active, icon: Zap },
                { label: 'Registered Voters',value: stats.voters.toLocaleString(), icon: Users },
                { label: 'Votes Cast',        value: stats.votes.toLocaleString(), icon: CheckCircle },
              ].map(({ label, value, icon: Icon }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  className="glass-card p-5"
                >
                  <Icon className="w-6 h-6 text-teal-300 mb-3" />
                  <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
                  <div className="text-blue-200 text-sm">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full fill-slate-50">
            <path d="M0,64L80,58.7C160,53,320,43,480,42.7C640,43,800,53,960,56C1120,59,1280,53,1360,50.7L1440,48L1440,80L0,80Z" />
          </svg>
        </div>
      </section>

      {/* ── Elections Section ── */}
      <section className="page-section" id="elections">
        <div className="container-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-800 mb-3">Active Elections</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Participate in ongoing elections or discover upcoming ones. Real-time results updated every 15 seconds.</p>
          </motion.div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search elections..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 bg-white" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-primary-700 text-white shadow-primary'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {error && !loading && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((el, i) => <ElectionCard key={el.id} election={el} index={i} />)}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/elections" className="btn-outline inline-flex items-center gap-2">
              View All Elections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="page-section bg-primary-950">
        <div className="container-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">Why VoteSecure?</h2>
            <p className="text-blue-200 max-w-xl mx-auto">Built for trust. Designed for everyone. Powered by cutting-edge security.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass-card p-6 hover:bg-white/15 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats chart ── */}
      <section className="page-section bg-white">
        <div className="container-xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-3xl font-bold text-slate-800 mb-4">Platform Activity</h2>
              <p className="text-slate-500 mb-6">Elections hosted on VoteSecure are growing month by month. Join the thousands of organizations choosing secure digital democracy.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Uptime', value: '99.9%' },
                  { label: 'Avg. Turnout', value: '74%' },
                  { label: 'Elections', value: '200+' },
                  { label: 'Countries', value: '15+' },
                ].map(({ label, value }) => (
                  <div key={label} className="card p-4">
                    <div className="text-2xl font-display font-bold text-primary-700">{value}</div>
                    <div className="text-sm text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="card p-6">
                <h3 className="font-semibold text-slate-700 mb-5">Elections per Month</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statsData} barSize={32}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="elections" fill="url(#barGrad)" radius={[6,6,0,0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#0d9488" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="page-section bg-gradient-to-r from-primary-800 to-teal-700">
        <div className="container-xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Ready to hold your election?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">Create your free account and launch your first election in minutes. Secure, transparent, and beautiful by default.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="btn-teal py-3.5 px-8 text-base flex items-center gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/elections" className="py-3.5 px-8 rounded-xl border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-colors text-base">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

const EmptyState = () => (
  <div className="text-center py-20">
    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
      <Vote className="w-10 h-10 text-slate-400" />
    </div>
    <h3 className="font-display font-semibold text-slate-700 mb-2">No elections found</h3>
    <p className="text-slate-400 text-sm">Try a different search or filter.</p>
  </div>
)

export default LandingPage

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fetchVisibleElections, getErrorMessage } from '../../lib/electionData'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import ElectionCard from '../../components/elections/ElectionCard'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { Search, Filter, Vote } from 'lucide-react'

const FILTERS = ['All', 'Active', 'Upcoming', 'Completed', 'Draft']
const CATEGORIES = ['All', 'Student Council', 'Corporate', 'Community', 'Government', 'Other']

const ElectionsList = () => {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    setLoading(true)
    setError('')
    try {
      setElections(await fetchVisibleElections({ orderBy: 'start_at' }))
    } catch (error) {
      console.error('Failed to fetch elections:', error)
      setError(getErrorMessage(error, 'Failed to load elections.'))
      setElections([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = elections.filter(el => {
    const matchStatus = filter === 'All' || el.status === filter.toLowerCase()
    const matchCategory = category === 'All' || el.category === category
    const matchSearch = el.title.toLowerCase().includes(search.toLowerCase()) || 
                        (el.description || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="bg-primary-900 pt-28 pb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <h1 className="font-display text-4xl font-bold text-white mb-4">Discover Elections</h1>
             <p className="text-blue-200 max-w-2xl mx-auto">Browse active elections, view upcoming ones, or check the results of past elections.</p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
           {/* Search */}
           <div className="relative flex-1">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input type="text" placeholder="Search elections by title or description..."
               value={search} onChange={e => setSearch(e.target.value)}
               className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
           </div>
           
           {/* Filters */}
           <div className="flex gap-3">
              <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <select 
                    value={filter} onChange={(e) => setFilter(e.target.value)}
                    className="pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer min-w-[140px]"
                 >
                    {FILTERS.map(f => <option key={f} value={f}>{f} Status</option>)}
                 </select>
              </div>
              <select 
                 value={category} onChange={(e) => setCategory(e.target.value)}
                 className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer min-w-[140px]"
              >
                 {CATEGORIES.map(c => <option key={c} value={c}>{c} Category</option>)}
              </select>
           </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
           <h2 className="font-semibold text-slate-700">
             {loading ? 'Searching...' : `Found ${filtered.length} elections`}
           </h2>
        </div>

        {error && !loading && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-24 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-5">
                <Vote className="w-10 h-10 text-slate-400" />
             </div>
             <h3 className="font-display text-xl font-semibold text-slate-800 mb-2">No elections found</h3>
             <p className="text-slate-500 max-w-md mx-auto">We couldn't find any elections matching your current filters. Try adjusting your search or clearing the filters.</p>
             <button 
                onClick={() => { setSearch(''); setFilter('All'); setCategory('All'); }}
                className="mt-6 btn-outline"
             >
                Clear Filters
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((el, i) => <ElectionCard key={el.id} election={el} index={i} />)}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}

export default ElectionsList

import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Vote, Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react'

const Navbar = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { 
    setMenuOpen(false)
    setDropOpen(false)
  }, [location])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropOpen(false)
      }
    }
    
    if (dropOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropOpen])

  const dashboardLink = {
    admin:            '/admin',
    election_creator: '/creator',
    voter:            '/voter',
  }[profile?.role] || '/voter'

  const navLinks = [
    { label: 'Home',        to: '/' },
    { label: 'Elections',   to: '/elections' },
    { label: 'Results',     to: '/results' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-700 to-teal-600 flex items-center justify-center shadow-primary">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className={`font-display font-bold text-xl ${scrolled ? 'text-primary-900' : 'text-white'}`}>
              VoteSecure
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? scrolled ? 'bg-primary-100 text-primary-700' : 'bg-white/20 text-white'
                    : scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    scrolled ? 'hover:bg-slate-100 text-slate-700' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span>{profile?.name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{profile?.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{profile?.role?.replace('_', ' ')}</p>
                      </div>
                      <div className="p-2">
                        <Link 
                          to={dashboardLink} 
                          className="nav-item text-sm" 
                          onClick={() => setDropOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link 
                          to="/profile" 
                          className="nav-item text-sm" 
                          onClick={() => setDropOpen(false)}
                        >
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        <button 
                          onClick={async () => { 
                            setDropOpen(false)
                            await signOut()
                            navigate('/')
                          }}
                          className="nav-item text-sm w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                  scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
                }`}>Log In</Link>
                <Link to="/register" className="btn-teal text-sm py-2 px-5">Register</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden p-2 rounded-xl ${scrolled ? 'text-slate-700' : 'text-white'}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
                {user ? (
                  <>
                    <Link 
                      to={dashboardLink} 
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={async () => {
                        await signOut()
                        navigate('/')
                      }} 
                      className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login"    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Log In</Link>
                    <Link to="/register" className="block px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-700 text-white text-center">Register</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar

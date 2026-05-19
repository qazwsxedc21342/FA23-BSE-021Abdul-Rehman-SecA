import { Link } from 'react-router-dom'
import { Vote, Globe, MessageSquare, Mail, Heart } from 'lucide-react'

const Footer = () => (
  <footer className="bg-primary-950 text-white pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl">VoteSecure</span>
          </Link>
          <p className="text-blue-200 text-sm leading-relaxed max-w-sm">
            A transparent, secure, and modern platform for conducting digital elections with full auditability.
          </p>
          <div className="flex items-center gap-3 mt-5">
            {[Globe, MessageSquare, Mail].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-display font-semibold text-white mb-4">Platform</h4>
          <ul className="space-y-2.5">
            {['Elections', 'Results', 'How It Works', 'Security'].map(item => (
              <li key={item}>
                <Link to="/" className="text-blue-200 hover:text-white text-sm transition-colors">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-4">Account</h4>
          <ul className="space-y-2.5">
            {[['Login', '/login'], ['Register', '/register'], ['Dashboard', '/voter']].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-blue-200 hover:text-white text-sm transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-blue-300 text-sm">© 2025 VoteSecure. All rights reserved.</p>
        <p className="text-blue-300 text-sm flex items-center gap-1">
          Built with <Heart className="w-3 h-3 text-red-400 fill-red-400 mx-0.5" /> for transparent democracy
        </p>
      </div>
    </div>
  </footer>
)

export default Footer

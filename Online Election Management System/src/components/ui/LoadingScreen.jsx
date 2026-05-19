import { motion } from 'framer-motion'

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-hero flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Logo icon */}
      <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
        <svg viewBox="0 0 48 48" className="w-12 h-12 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm-2 28.828-8.414-8.414 2.828-2.828L22 27.172l9.586-9.586 2.828 2.828L22 32.828z"/>
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-white">VoteSecure</h2>
        <p className="text-blue-200 text-sm mt-1">Loading secure session...</p>
      </div>
      {/* Spinner */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-white rounded-full"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  </div>
)

export default LoadingScreen

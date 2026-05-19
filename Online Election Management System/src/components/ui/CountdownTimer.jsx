import { useEffect, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

const pad = (n) => String(n).padStart(2, '0')

const CountdownTimer = ({ targetDate, onExpire, className = '', compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const calc = () => {
      const diff = differenceInSeconds(new Date(targetDate), new Date())
      if (diff <= 0) {
        setExpired(true)
        onExpire?.()
        return
      }
      setTimeLeft({
        days:    Math.floor(diff / 86400),
        hours:   Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (expired) return (
    <span className="text-red-500 font-semibold text-sm">Expired</span>
  )

  if (compact) return (
    <span className={`font-mono font-semibold ${className}`}>
      {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  )

  const blocks = [
    { label: 'Days',    value: timeLeft.days },
    { label: 'Hours',   value: timeLeft.hours },
    { label: 'Mins',    value: timeLeft.minutes },
    { label: 'Secs',    value: timeLeft.seconds },
  ]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {blocks.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="countdown-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={value}
                className="countdown-number"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0,   opacity: 1 }}
                exit={   { y:  10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {pad(value)}
              </motion.span>
            </AnimatePresence>
            <span className="countdown-label">{label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-white/60 text-xl font-bold self-start mt-1">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default CountdownTimer

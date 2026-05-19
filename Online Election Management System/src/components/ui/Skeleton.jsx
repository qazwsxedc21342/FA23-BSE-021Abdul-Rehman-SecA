import { motion } from 'framer-motion'

const Skeleton = ({ className = '' }) => (
  <div className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-xl ${className}`} />
)

export const CardSkeleton = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-5/6" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  </div>
)

export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="border-b border-slate-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
)

export const StatCardSkeleton = () => (
  <div className="card p-6 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-24" />
  </div>
)

export default Skeleton

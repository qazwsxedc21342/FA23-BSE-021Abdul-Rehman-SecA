import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getErrorMessage, runQuery } from '../../lib/electionData'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react'

const AdminApprovals = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data } = await runQuery(
        supabase
          .from('creator_requests')
          .select(`
            *,
            users:user_id (name, email)
          `)
          .order('created_at', { ascending: false }),
        'Loading creator requests'
      )
      setRequests(data || [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load requests'))
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, status, userId) => {
    let rejectionReason = null
    if (status === 'rejected') {
       rejectionReason = window.prompt("Please provide a reason for rejection:")
       if (!rejectionReason) {
          toast.error("Rejection reason is required.")
          return
       }
    }

    try {
      // Update request status
      await runQuery(
        supabase
          .from('creator_requests')
          .update({ status, rejection_reason: rejectionReason })
          .eq('id', id),
        'Updating creator request'
      )

      // If approved, update user role to 'election_creator'
      if (status === 'approved') {
         await runQuery(
           supabase
              .from('users')
              .update({ role: 'election_creator', verified: true })
              .eq('id', userId),
           'Approving creator role'
         )
      }

      // Send notification
      await runQuery(
        supabase.from('notifications').insert({
           user_id: userId,
           type: 'approval_status',
           message: status === 'approved' 
              ? 'Your request to become an Election Creator has been approved!' 
              : `Your request to become an Election Creator was rejected. Reason: ${rejectionReason}`
        }),
        'Creating notification'
      )

      toast.success(`Request ${status} successfully`)
      fetchRequests()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to process action'))
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading requests...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
           <ShieldAlert className="w-6 h-6 text-primary-600" />
           Creator Approvals
        </h1>
        <p className="text-slate-500 text-sm mt-1">Review and manage election creator access requests.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Organization</th>
                  <th className="p-4 font-semibold">Purpose</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {requests.length === 0 ? (
                  <tr>
                     <td colSpan="5" className="p-8 text-center text-slate-500 italic">No pending requests found.</td>
                  </tr>
               ) : requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-4">
                        <p className="font-medium text-slate-800">{req.users?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{req.users?.email}</p>
                     </td>
                     <td className="p-4 text-sm text-slate-600">{req.organization}</td>
                     <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={req.purpose}>{req.purpose}</td>
                     <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                           req.status === 'approved' ? 'bg-green-100 text-green-700' :
                           req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                           'bg-orange-100 text-orange-700'
                        }`}>
                           {req.status === 'pending' && <Clock className="w-3 h-3" />}
                           {req.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                           {req.status === 'rejected' && <XCircle className="w-3 h-3" />}
                           {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                     </td>
                     <td className="p-4 text-right">
                        {req.status === 'pending' && (
                           <div className="flex justify-end gap-2">
                              <button onClick={() => handleAction(req.id, 'approved', req.user_id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Approve">
                                 <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleAction(req.id, 'rejected', req.user_id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Reject">
                                 <XCircle className="w-4 h-4" />
                              </button>
                           </div>
                        )}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  )
}

export default AdminApprovals

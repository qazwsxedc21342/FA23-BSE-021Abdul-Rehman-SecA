import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getErrorMessage, runQuery } from '../../lib/electionData'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Vote, ArrowLeft, Calendar, Users, Settings } from 'lucide-react'

const CreateElectionPage = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin'
  const backPath = isAdmin ? '/admin/elections' : '/creator'
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Student Council',
    start_at: '',
    end_at: '',
    deadline: '',
    max_voters: '',
    status: 'draft'
  })

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (!form.start_at || !form.end_at) throw new Error('Start and end date are required.')
      if (new Date(form.end_at) <= new Date(form.start_at)) {
        throw new Error('End date must be after start date.')
      }
      if (form.deadline && new Date(form.deadline) >= new Date(form.start_at)) {
        throw new Error('Registration deadline must be before the election starts.')
      }

      const electionData = {
        ...form,
        creator_id: user.id,
        max_voters: form.max_voters ? parseInt(form.max_voters) : null,
        status: publish ? 'published' : 'draft',
        deadline: form.deadline || null
      }
      
      const { data } = await runQuery(
        supabase
          .from('elections')
          .insert([electionData])
          .select()
          .single(),
        'Creating election'
      )
      
      // Auto-create a default poll for this election
      if (data) {
        await runQuery(
          supabase.from('polls').insert([{
             election_id: data.id,
             title: 'Main Poll',
             description: 'Default poll for this election'
          }]),
          'Creating default ballot'
        )
      }

      toast.success(publish ? 'Election published successfully!' : 'Draft saved successfully!')
      navigate(isAdmin ? '/admin/elections' : '/creator')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create election'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(backPath)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Create New Election</h1>
          <p className="text-slate-500 text-sm mt-1">Set up the details, rules, and timeline for your election.</p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Details */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
             <Vote className="w-5 h-5 text-primary-600" />
             <h2 className="font-display font-semibold text-slate-700">Basic Details</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="form-label">Election Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Annual Board Member Election" className="input-field" required />
            </div>
            
            <div>
              <label className="form-label">Description / Manifesto</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="4" placeholder="Describe the purpose of this election..." className="input-field resize-none"></textarea>
            </div>

            <div>
              <label className="form-label">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field cursor-pointer">
                <option value="Student Council">Student Council</option>
                <option value="Corporate">Corporate</option>
                <option value="Community">Community</option>
                <option value="Government">Government</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
             <Calendar className="w-5 h-5 text-teal-600" />
             <h2 className="font-display font-semibold text-slate-700">Timeline</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Start Date & Time</label>
              <input type="datetime-local" name="start_at" value={form.start_at} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="form-label">End Date & Time</label>
              <input type="datetime-local" name="end_at" value={form.end_at} onChange={handleChange} className="input-field" required />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Registration Deadline (Optional)</label>
              <input type="datetime-local" name="deadline" value={form.deadline} onChange={handleChange} className="input-field" />
              <p className="text-xs text-slate-500 mt-1.5">If left blank, voters can register until the election ends.</p>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
             <Settings className="w-5 h-5 text-orange-600" />
             <h2 className="font-display font-semibold text-slate-700">Voting Rules</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="form-label">Maximum Voters (Optional)</label>
              <div className="relative">
                 <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="number" name="max_voters" value={form.max_voters} onChange={handleChange} placeholder="e.g. 1000" className="input-field pl-10" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Cap the maximum number of participants allowed to register.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
           <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="btn-outline">
             Save as Draft
           </button>
           <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="btn-primary">
             Publish Election
           </button>
        </div>
      </form>
    </div>
  )
}

export default CreateElectionPage

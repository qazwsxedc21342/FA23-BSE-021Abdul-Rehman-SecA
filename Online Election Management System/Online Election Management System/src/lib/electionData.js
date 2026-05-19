import { supabase } from './supabase'

const REQUEST_TIMEOUT_MS = 9000
const SECRET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const getErrorMessage = (error, fallback = 'Something went wrong') => (
  error?.message || error?.details || error?.hint || fallback
)

export const withTimeout = (request, label = 'Request', timeoutMs = REQUEST_TIMEOUT_MS) => {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} took too long. Please check your Supabase connection and RLS policies.`))
    }, timeoutMs)
  })

  return Promise.race([request, timeout]).finally(() => clearTimeout(timer))
}

export const runQuery = async (query, label, timeoutMs) => {
  const result = await withTimeout(query, label, timeoutMs)
  if (result?.error) throw result.error
  return result
}

export const getRuntimeStatus = (election, now = new Date()) => {
  if (!election) return 'upcoming'
  if (election.status === 'draft') return 'draft'
  if (election.status === 'completed') return 'completed'
  
  // If database status is 'active', trust it (creator manually started it)
  if (election.status === 'active') return 'active'

  const start = election.start_at ? new Date(election.start_at) : null
  const end = election.end_at ? new Date(election.end_at) : null

  if (end && end <= now) return 'completed'
  if (start && start <= now && election.status === 'published') return 'active'
  if (start && start <= now) return 'active'
  return 'upcoming'
}

export const normalizeElection = (election, voteCount = 0) => ({
  ...election,
  db_status: election.status,
  status: getRuntimeStatus(election),
  vote_count: voteCount,
})

export const getPollIds = (polls = []) => polls.map(poll => poll.id).filter(Boolean)

export const fetchVoteCountsByPollIds = async (pollIds = []) => {
  if (!pollIds.length) return new Map()

  const { data } = await runQuery(
    supabase
      .from('votes')
      .select('poll_id')
      .in('poll_id', pollIds),
    'Loading vote counts'
  )

  return (data || []).reduce((counts, vote) => {
    counts.set(vote.poll_id, (counts.get(vote.poll_id) || 0) + 1)
    return counts
  }, new Map())
}

export const fetchVisibleElections = async ({ limit = null, orderBy = 'created_at' } = {}) => {
  let query = supabase
    .from('elections')
    .select('*, polls(id)')
    .in('status', ['published', 'active', 'completed'])
    .order(orderBy, { ascending: false })

  if (limit) query = query.limit(limit)

  const { data } = await runQuery(query, 'Loading elections')
  const elections = data || []
  const allPollIds = elections.flatMap(election => getPollIds(election.polls))

  let voteCounts = new Map()
  try {
    voteCounts = await fetchVoteCountsByPollIds(allPollIds)
  } catch (error) {
    console.warn('Vote counts could not be loaded:', error)
  }

  return elections.map(election => {
    const voteCount = getPollIds(election.polls)
      .reduce((sum, pollId) => sum + (voteCounts.get(pollId) || 0), 0)
    return normalizeElection(election, voteCount)
  })
}

export const fetchPlatformStats = async () => {
  const requests = await Promise.allSettled([
    runQuery(supabase.from('elections').select('*', { count: 'exact', head: true }), 'Loading election count'),
    runQuery(supabase.from('elections').select('*', { count: 'exact', head: true }).eq('status', 'active'), 'Loading active election count'),
    runQuery(supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'voter'), 'Loading voter count'),
    runQuery(supabase.from('votes').select('*', { count: 'exact', head: true }), 'Loading vote count'),
  ])

  const countAt = (index) => (
    requests[index].status === 'fulfilled' ? requests[index].value.count || 0 : 0
  )

  return {
    total: countAt(0),
    active: countAt(1),
    voters: countAt(2),
    votes: countAt(3),
  }
}

export const generateSecretId = () => {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes, byte => SECRET_ALPHABET[byte % SECRET_ALPHABET.length]).join('')
  return `POLL-${token.slice(0, 4)}-${token.slice(4)}`
}

export const maskSecretId = (secret) => {
  const clean = (secret || '').toUpperCase()
  const last = clean.slice(-4)
  return `POLL-****-${last || '----'}`
}

export const buildSecretRows = (pollIds, userId) => (
  pollIds.map(pollId => {
    const secret = generateSecretId()
    return {
      poll_id: pollId,
      user_id: userId,
      hashed_secret: secret,
      masked_secret: maskSecretId(secret),
    }
  })
)

export const ensureOwnSecretIds = async (pollIds, userId) => {
  if (!pollIds.length || !userId) return []

  const { data: existing } = await runQuery(
    supabase
      .from('secret_ids')
      .select('poll_id')
      .eq('user_id', userId)
      .in('poll_id', pollIds),
    'Checking secret IDs'
  )

  const existingPolls = new Set((existing || []).map(secret => secret.poll_id))
  const missingPollIds = pollIds.filter(pollId => !existingPolls.has(pollId))
  if (!missingPollIds.length) return []

  const rows = buildSecretRows(missingPollIds, userId)
  await runQuery(
    supabase.from('secret_ids').insert(rows),
    'Generating secret IDs'
  )
  return rows
}

export const registerForElection = async ({ election, polls, userId }) => {
  const pollIds = getPollIds(polls)
  if (!userId) throw new Error('Please log in to register for this election.')
  if (!pollIds.length) throw new Error('This election has no polls configured yet.')

  const runtimeStatus = getRuntimeStatus(election)
  if (runtimeStatus === 'completed') throw new Error('This election has ended.')
  if (election.deadline && new Date(election.deadline) < new Date()) {
    throw new Error('Registration deadline has passed.')
  }

  const { data: existing } = await runQuery(
    supabase
      .from('voter_registrations')
      .select('poll_id, status')
      .eq('user_id', userId)
      .in('poll_id', pollIds),
    'Checking registration'
  )

  const existingPolls = new Set((existing || []).map(reg => reg.poll_id))
  if (existingPolls.size === pollIds.length) {
    return {
      alreadyRegistered: true,
      status: existing?.[0]?.status || 'registered',
    }
  }

  let registrationStatus = 'registered'
  if (election.max_voters && pollIds[0]) {
    const { count } = await runQuery(
      supabase
        .from('voter_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollIds[0])
        .neq('status', 'rejected'),
      'Checking voter capacity'
    )

    if ((count || 0) >= election.max_voters) registrationStatus = 'waitlisted'
  }

  const registrationRows = pollIds
    .filter(pollId => !existingPolls.has(pollId))
    .map(pollId => ({
      poll_id: pollId,
      user_id: userId,
      status: registrationStatus,
    }))

  if (registrationRows.length) {
    await runQuery(
      supabase.from('voter_registrations').insert(registrationRows),
      'Registering voter'
    )
  }

  if (registrationStatus === 'registered') {
    await ensureOwnSecretIds(pollIds, userId)
  }

  return {
    alreadyRegistered: false,
    status: registrationStatus,
  }
}

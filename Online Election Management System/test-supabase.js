import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

const localEnv = existsSync('.env')
  ? Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
        .map(line => {
          const index = line.indexOf('=')
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
        })
    )
  : {}

const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Fetching...')
  try {
    const { data, error } = await supabase
      .from('elections')
      .select(`*, polls(id, votes:votes(count))`)
      .in('status', ['published', 'active', 'completed'])
      .order('start_at', { ascending: false })
      
    console.log('Data:', data)
    console.log('Error:', error)
  } catch(e) {
    console.error('Exception:', e)
  }
}

test()

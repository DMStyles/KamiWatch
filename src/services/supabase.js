import { createClient } from '@supabase/supabase-js'

// Default KamiWatch Supabase Cloud Sync Endpoint
const DEFAULT_SUPABASE_URL = 'https://kamiwatch-sync.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWl3YXRjaC1zeW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAyMDAwMDAwMH0.fake_key'

export const getSupabaseSettings = () => {
  try {
    const saved = localStorage.getItem('kamiwatch-supabase-config')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY }
}

export const saveSupabaseSettings = (url, key) => {
  localStorage.setItem('kamiwatch-supabase-config', JSON.stringify({ url, key }))
}

export const createSupabaseInstance = () => {
  const { url, key } = getSupabaseSettings()
  if (!url || !key) return null
  try {
    return createClient(url, key)
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e)
    return null
  }
}

export const supabase = createSupabaseInstance()

/**
 * Trigger official Google OAuth login via Supabase
 */
export const signInWithGoogleOAuth = async () => {
  const client = createSupabaseInstance()
  if (!client) throw new Error('Supabase client not configured')

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })

  if (error) throw error
  return data
}

/**
 * Upload and sync user history, watchlist, and favorites to Supabase Cloud
 */
export const syncDataToSupabase = async (user, dataBundle) => {
  const client = createSupabaseInstance()
  if (!client || !user?.id) return false

  try {
    const { error } = await client
      .from('user_sync')
      .upsert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        sync_data: dataBundle,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      console.warn('Supabase sync warning:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('Supabase sync exception:', e)
    return false
  }
}

/**
 * Download user cloud sync bundle from Supabase
 */
export const fetchCloudDataFromSupabase = async (userId) => {
  const client = createSupabaseInstance()
  if (!client || !userId) return null

  try {
    const { data, error } = await client
      .from('user_sync')
      .select('sync_data, updated_at')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null
    return data.sync_data
  } catch (e) {
    console.error('Supabase download error:', e)
    return null
  }
}

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useEntries() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const fetchWeek = useCallback(async (mondayDate) => {
    if (!user) return {}
    setLoading(true)
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const start = fmt(mondayDate)
    const end = new Date(mondayDate)
    end.setDate(end.getDate() + 6)
    const endStr = fmt(end)

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', endStr)

    setLoading(false)
    if (error) { console.error(error); return {} }

    const map = {}
    data.forEach(e => { map[e.date] = e })
    return map
  }, [user])

  const saveEntry = useCallback(async (date, entryData) => {
    if (!user) return
    const payload = { ...entryData, date, user_id: user.id }
    const { error } = await supabase
      .from('entries')
      .upsert(payload, { onConflict: 'user_id,date' })
    if (error) console.error(error)
    return !error
  }, [user])

  const fetchAllEntries = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (error) { console.error(error); return [] }
    return data
  }, [user])

  const deleteEntry = useCallback(async (date) => {
    if (!user) return false
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date)
    if (error) { console.error(error); return false }
    return true
  }, [user])

  return { fetchWeek, saveEntry, fetchAllEntries, deleteEntry, loading }
}

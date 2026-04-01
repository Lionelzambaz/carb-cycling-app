import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMeasurements() {
  const { user } = useAuth()

  const fetchAll = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: true })
    if (error) { console.error(error); return [] }
    return data
  }, [user])

  const saveMeasurement = useCallback(async (weekStart, data) => {
    if (!user) return false
    const payload = { ...data, week_start: weekStart, user_id: user.id }
    const { error } = await supabase
      .from('measurements')
      .upsert(payload, { onConflict: 'user_id,week_start' })
    if (error) { console.error(error); return false }
    return true
  }, [user])

  const deleteMeasurement = useCallback(async (weekStart) => {
    if (!user) return false
    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
    if (error) { console.error(error); return false }
    return true
  }, [user])

  return { fetchAll, saveMeasurement, deleteMeasurement }
}

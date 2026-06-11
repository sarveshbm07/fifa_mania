export async function getSystemLockStatus(supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'predictions_locked')
      .single()
      
    if (error || !data) {
      return false
    }
    return data.value === true
  } catch (err) {
    return false
  }
}

export async function setSystemLockStatus(supabase: any, locked: boolean): Promise<{ success?: string; error?: string }> {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'predictions_locked', value: locked })
      
    if (error) {
      return { error: error.message }
    }
    return { success: 'Lock status updated successfully' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update lock status' }
  }
}

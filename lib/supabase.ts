import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(url!, anonKey!)

export function createServerSupabase() {
  const key = serviceRoleKey ?? anonKey
  return createClient(process.env.SUPABASE_URL ?? url!, key!)
}
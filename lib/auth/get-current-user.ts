import { supabase } from '@/lib/supabase'

/**
 * TEMPORAL: Obtiene el ID de la empresa actual
 * TODO: Reemplazar con auth real cuando se implemente Supabase Auth
 */
export async function getCurrentCompanyId(): Promise<string | null> {
  // TEMPORAL: Retornar ID hardcodeado
  // Cuando implementes auth, cambiar a:
  // const { data: { user } } = await supabase.auth.getUser()
  // return user?.user_metadata?.company_id || null
  
  return 'caa6a12e-b110-4616-b786-7f18fea2b443'
}

/**
 * TEMPORAL: Obtiene el ID de la empresa desde URL (fallback)
 */
export function getCompanyIdFromUrl(): string {
  if (typeof window === 'undefined') {
    return 'caa6a12e-b110-4616-b786-7f18fea2b443'
  }
  
  const params = new URLSearchParams(window.location.search)
  return params.get('empresa_id') || 'caa6a12e-b110-4616-b786-7f18fea2b443'
}
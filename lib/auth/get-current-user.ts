import { supabase } from '@/lib/supabase'

/**
 * Obtiene el ID de la empresa del usuario autenticado
 */
export async function getCurrentCompanyId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Si tiene company_id en metadata, usarlo
    if (user?.user_metadata?.company_id) {
      return user.user_metadata.company_id
    }
    
    // Si no, buscar en COMPANY por owner
    if (user?.id) {
      const { data: company } = await supabase
        .from('COMPANY')
        .select('id')
        .eq('owner', user.id)
        .single()
      
      if (company) {
        return company.id
      }
    }
    
    // FALLBACK
    console.warn('Usuario no autenticado, usando empresa de prueba')
    return 'caa6a12e-b110-4616-b786-7f18fea2b443'
  } catch (error) {
    console.error('Error obteniendo company_id:', error)
    return 'caa6a12e-b110-4616-b786-7f18fea2b443'
  }
}

/**
 * Obtiene el ID de la empresa desde URL (fallback)
 */
export function getCompanyIdFromUrl(): string {
  if (typeof window === 'undefined') {
    return 'caa6a12e-b110-4616-b786-7f18fea2b443'
  }
  
  const params = new URLSearchParams(window.location.search)
  return params.get('empresa_id') || 'caa6a12e-b110-4616-b786-7f18fea2b443'
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
}

/**
 * Verifica si hay un usuario autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Obtiene el rol del usuario actual
 */
export async function getCurrentUserRole(): Promise<'company' | 'student' | 'admin' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.user_metadata?.role || null
  } catch (error) {
    console.error('Error obteniendo rol:', error)
    return null
  }
}

export async function isCompany(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'company'
}

export async function isStudent(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'student'
}

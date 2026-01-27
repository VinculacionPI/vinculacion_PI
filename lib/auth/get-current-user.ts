import { supabase } from '@/lib/supabase'

/**
 * Obtiene el ID de la empresa del usuario autenticado
 */
export async function getCurrentCompanyId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    
    console.log('User session:', user?.email, user?.user_metadata)
    
    // Si tiene company_id en metadata, usarlo
    if (user?.user_metadata?.company_id) {
      console.log('Company ID from metadata:', user.user_metadata.company_id)
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
        console.log('Company ID from COMPANY table:', company.id)
        return company.id
      }
    }
    
    // FALLBACK
    console.warn('Usando fallback company_id')
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
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
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
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.user_metadata?.role || null
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

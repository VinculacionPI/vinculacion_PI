import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth/get-current-user'

const BACKEND_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export interface DashboardEmpresaResponse {
  success: boolean
  data: any
}

export interface ExplorarOportunidadesResponse {
  success: boolean
  data: any[]
  paginacion: any
}

async function callEdgeFunction<T>(functionName: string, body: any): Promise<T> {
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const response = await fetch(`${BACKEND_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[persona5] Error ${response.status}:`, errorText)
    throw new Error(`Error ${response.status}: ${errorText}`)
  }

  return response.json()
}

export async function obtenerDashboardEmpresa(empresaId: string, dias = 30): Promise<DashboardEmpresaResponse> {
  return callEdgeFunction('dashboard-empresa', { empresa_id: empresaId, dias })
}

export async function explorarOportunidades({ busqueda = '', tipo = [], pagina = 1, limite = 12 }: any): Promise<ExplorarOportunidadesResponse> {
  return callEdgeFunction('buscar-oportunidades', { busqueda, tipo, pagina, limite })
}

export async function registrarVisualizacion(publicacionId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

    // Insertar directamente en la tabla
    const { error } = await supabase
      .from('visualizaciones')
      .insert({
        publicacion_id: publicacionId,
        usuario_id: user?.id || null,  // <-- NULL en lugar de UUID falso
      })

    if (error) {
      console.error('[persona5] Error insertando visualización:', error)
    } else {
      console.log('[persona5] ✅ Visualización registrada:', publicacionId)
    }
  } catch (error) {
    console.error('[persona5] Exception:', error)
  }
}


export async function generarFlyer(publicacionId: string, plantilla = 'default') {
  return callEdgeFunction('generar-flyer', {
    publicacion_id: publicacionId,
    plantilla,
  })
}

  export async function generarInformeTFG({
    empresa_id,
    tipo,
    formato = 'JSON',
  }: {
    empresa_id?: string
    tipo?: string
    formato?: 'CSV' | 'JSON'
  } = {}) {
    return callEdgeFunction('generar-informe-tfg', {
      empresa_id,
      tipo,
      formato,
    })
  }

export async function obtenerOportunidad(id: string) {
  const { data, error } = await supabase
    .from('OPPORTUNITY')
    .select('*, COMPANY(id, name, logo_path)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[persona5] Error obteniendo oportunidad:', error)
    throw error
  }
  
  return data
}

export async function obtenerOportunidadesEmpresa(empresaId: string) {
  const { data, error } = await supabase
    .from('OPPORTUNITY')
    .select('*')
    .eq('company_id', empresaId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[persona5] Error obteniendo oportunidades de empresa:', error)
    throw error
  }
  
  return data || []
}


export async function enviarNotificacion(params: {
  usuario_destino: string
  tipo: string
  titulo: string
  mensaje: string
  entidad_tipo?: string
  entidad_id?: string
}) {
  try {
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const response = await fetch(`${BACKEND_URL}/functions/v1/enviar-notificacion`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Error enviando notificación:', result)
    }
    
    return result
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error }
  }
}


export async function obtenerInteresados(params: {
  opportunity_id: string
  filters?: {
    carrera?: string
    fecha_desde?: string
    fecha_hasta?: string
  }
}) {
  try {
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const response = await fetch(`${BACKEND_URL}/functions/v1/obtener-interesados`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Error obteniendo interesados:', result)
    }
    
    return result
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error }
  }
}

export async function registrarInteres(opportunity_id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('INTEREST')
      .insert({
        opportunity_id,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error registrando interés:', error)
    return { success: false, error: error.message }
  }
}

export async function eliminarInteres(opportunity_id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { error } = await supabase
      .from('INTEREST')
      .delete()
      .eq('opportunity_id', opportunity_id)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Error eliminando interés:', error)
    return { success: false, error: error.message }
  }
}

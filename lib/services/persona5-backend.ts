import { supabase } from '@/lib/supabase'

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

export async function enviarNotificacion({
  usuario_destino,
  tipo,
  titulo,
  contenido,
  entidad_tipo,
  entidad_id,
}: {
  usuario_destino: string
  tipo: string
  titulo: string
  contenido?: string
  entidad_tipo?: string
  entidad_id?: string
}) {
  return callEdgeFunction('enviar-notificacion', {
    usuario_destino,
    tipo,
    titulo,
    contenido,
    entidad_tipo,
    entidad_id,
    enviar_email: true,
  })
}

export async function generarFlyer(publicacionId: string, plantilla = 'default') {
  return callEdgeFunction('generar-flyer', {
    publicacion_id: publicacionId,
    plantilla,
  })
}

export async function generarInforme({
  tipo,
  fecha_inicio,
  fecha_fin,
  formato = 'CSV',
}: {
  tipo: 'empresas' | 'oportunidades' | 'estudiantes' | 'aplicaciones'
  fecha_inicio?: string
  fecha_fin?: string
  formato?: 'CSV' | 'JSON'
}) {
  return callEdgeFunction('generar-informe-tfg', {
    tipo,
    fecha_inicio,
    fecha_fin,
    formato,
  })
}

export async function generarInformeTFG(formato: 'CSV' | 'JSON' = 'CSV') {
  return callEdgeFunction('generar-informe-tfg', { formato })
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
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { id } = await ctx.params

  const { data: auth } = await supabase.auth.getUser()
  let userId: string | null = auth?.user?.id ?? null
  if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

  if (!userId) {
    return NextResponse.json({ message: "No autenticado y sin DEV_USER_ID" }, { status: 401 })
  }

  // Obtener datos de la oportunidad y la empresa ANTES de actualizar
  const { data: opportunityData, error: fetchError } = await supabase
    .from("OPPORTUNITY")
    .select("id, title, type, company_id, COMPANY(name)")
    .eq("id", id)
    .single()

  if (fetchError || !opportunityData) {
    return NextResponse.json(
      { message: "Error obteniendo oportunidad", detail: fetchError?.message },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .update({
      approval_status: "APPROVED",
      lifecycle_status: "ACTIVE",
      status: "OPEN",
    })
    .eq("id", id)
    .select("id,title,approval_status,company_id,created_at,lifecycle_status")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { message: "Error al aprobar oportunidad", detail: error?.message },
      { status: 500 }
    )
  }

  await supabase.from("AUDIT_LOG").insert({
    action: "APPROVE",
    entity: "OPPORTUNITY",
    entity_id: data.id,
    company_id: data.company_id,
    user_id: userId,
    details: JSON.stringify({ approval_status: data.approval_status, title: data.title }),
    opportunity_id: data.id,
  })

  //  NOTIFICAR A ESTUDIANTES/GRADUADOS SEGÚN EL TIPO
  try {
    console.log('Creando notificaciones según tipo de oportunidad...')
    
    let targetRoles: string[] = []
    
    if (opportunityData.type === 'JOB') {
      targetRoles = ['graduate']
    } else if (opportunityData.type === 'INTERNSHIP' || opportunityData.type === 'TFG') {
      targetRoles = ['student']
    }

    if (targetRoles.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('USERS')
        .select('id')
        .in('role', targetRoles)

      if (usersError) {
        console.error('Error consultando usuarios:', usersError)
      } else if (users && users.length > 0) {
        const companyName = (opportunityData.COMPANY as any)?.name || 'Una empresa'
        
        let tipoTexto = 'oportunidad'
        if (opportunityData.type === 'INTERNSHIP') tipoTexto = 'pasantía'
        else if (opportunityData.type === 'TFG') tipoTexto = 'proyecto'
        else if (opportunityData.type === 'JOB') tipoTexto = 'empleo'

        const notifications = users.map(u => ({
          user_id: u.id,
          type: 'NEW_OPPORTUNITY',
          title: `Nueva ${tipoTexto} disponible`,
          message: `${companyName} publicó: ${opportunityData.title}`,
          entity_type: 'opportunity',
          entity_id: id,
          is_read: false,
          created_at: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
          .from('NOTIFICATION')
          .insert(notifications)

        if (insertError) {
          console.error('Error insertando notificaciones:', insertError)
        } else {
          console.log(`${notifications.length} notificaciones enviadas a ${targetRoles.join(', ')}`)
        }
      }
    }
  } catch (notifError) {
    console.error('Error creando notificaciones:', notifError)
  }

  // NOTIFICAR A LA EMPRESA QUE SU OPORTUNIDAD FUE APROBADA
  try {
    console.log('Notificando a la empresa...')
    
    const { data: companyUser } = await supabase
      .from('USERS')
      .select('id')
      .eq('id', opportunityData.company_id)
      .single()

    if (companyUser) {
      let tipoTexto = 'oportunidad'
      if (opportunityData.type === 'INTERNSHIP') tipoTexto = 'pasantía'
      else if (opportunityData.type === 'TFG') tipoTexto = 'proyecto'
      else if (opportunityData.type === 'JOB') tipoTexto = 'empleo'

      await supabase.from('NOTIFICATION').insert({
        user_id: companyUser.id,
        type: 'OPPORTUNITY_APPROVED',
        title: `${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)} aprobada`,
        message: `Tu ${tipoTexto} "${opportunityData.title}" ha sido aprobada y está visible`,
        entity_type: 'opportunity',
        entity_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      })
      
      console.log('Notificación enviada a la empresa')
    }
  } catch (companyNotifError) {
    console.warn('Error notificando a empresa:', companyNotifError)
  }

  return NextResponse.json({ message: "Oportunidad aprobada", opportunity: data }, { status: 200 })
}

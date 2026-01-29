import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { id } = await ctx.params

  const body = await req.json().catch(() => ({} as any))
  const reason = String(body?.rejection_reason ?? body?.reason ?? "").trim()

  if (reason.length < 20) {
    return NextResponse.json(
      { message: "El motivo de rechazo debe tener mínimo 20 caracteres" },
      { status: 400 }
    )
  }

  const { data: auth } = await supabase.auth.getUser()
  let userId: string | null = auth?.user?.id ?? null
  if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

  if (!userId) {
    return NextResponse.json({ message: "No autenticado y sin DEV_USER_ID" }, { status: 401 })
  }

  // Obtener datos de la oportunidad ANTES de actualizar
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
      approval_status: "REJECTED",
      lifecycle_status: "INACTIVE",
      status: "CLOSED",
    })
    .eq("id", id)
    .select("id,title,approval_status,company_id,created_at,lifecycle_status")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { message: "Error al rechazar oportunidad", detail: error?.message },
      { status: 500 }
    )
  }

  await supabase.from("REJECT_OPPORTUNITY").insert({
    opportunity: data.id,
    reason,
  })

  await supabase.from("AUDIT_LOG").insert({
    action: "REJECT",
    entity: "OPPORTUNITY",
    entity_id: data.id,
    company_id: data.company_id,
    user_id: userId,
    details: JSON.stringify({ approval_status: data.approval_status, title: data.title, rejection_reason: reason }),
    opportunity_id: data.id,
  })

  // NOTIFICAR A LA EMPRESA QUE SU OPORTUNIDAD FUE RECHAZADA
  try {
    console.log('Notificando rechazo a la empresa...')
    
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
        type: 'OPPORTUNITY_REJECTED',
        title: `${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)} rechazada`,
        message: `Tu ${tipoTexto} "${opportunityData.title}" fue rechazada. Motivo: ${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}`,
        entity_type: 'opportunity',
        entity_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      })
      
      console.log('Notificación de rechazo enviada a la empresa')
    }
  } catch (companyNotifError) {
    console.warn('Error notificando a empresa:', companyNotifError)
  }

  return NextResponse.json({ message: "Oportunidad rechazada", opportunity: { ...data, rejection_reason: reason } }, { status: 200 })
}
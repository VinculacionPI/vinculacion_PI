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

  // auth
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  let userId: string | null = auth?.user?.id ?? null
  if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

  if (authErr) {
    return NextResponse.json({ message: "Error auth.getUser()", detail: authErr.message }, { status: 401 })
  }
  if (!userId) {
    return NextResponse.json({ message: "No autenticado y sin DEV_USER_ID" }, { status: 401 })
  }

  // 1) update OPPORTUNITY
  const { data: opp, error: oppErr } = await supabase
    .from("OPPORTUNITY")
    .update({
      approval_status: "REJECTED",
      lifecycle_status: "INACTIVE",
      status: "CLOSED",
    })
    .eq("id", id)
    .select("id,title,approval_status,company_id,created_at,lifecycle_status")
    .single()

  if (oppErr || !opp) {
    return NextResponse.json(
      {
        message: "Falló update OPPORTUNITY",
        step: "update_opportunity",
        detail: oppErr?.message,
        code: (oppErr as any)?.code,
        hint: (oppErr as any)?.hint,
      },
      { status: 500 }
    )
  }

  // 2) insert REJECT_OPPORTUNITY (si falla, igual devolvemos éxito de rechazo)
  const { error: rejErr } = await supabase.from("REJECT_OPPORTUNITY").insert({
    opportunity: opp.id,
    reason,
  })

  if (rejErr) {
    // Devolvemos 200 pero avisamos que no guardó motivo
    return NextResponse.json(
      {
        message: "Oportunidad rechazada, pero falló guardar el motivo",
        step: "insert_reject_opportunity",
        detail: rejErr.message,
        code: (rejErr as any)?.code,
        hint: (rejErr as any)?.hint,
        opportunity: opp,
      },
      { status: 200 }
    )
  }

  // 3) insert AUDIT_LOG (si falla, igual devolvemos éxito)
  const { error: auditErr } = await supabase.from("AUDIT_LOG").insert({
    action: "REJECT",
    entity: "OPPORTUNITY",
    entity_id: String(opp.id),
    company_id: String(opp.company_id),
    opportunity_id: String(opp.id),
    user_id: String(userId),
    details: JSON.stringify({
      approval_status: opp.approval_status,
      title: opp.title,
      rejection_reason: reason,
    }),
  })

  if (auditErr) {
    return NextResponse.json(
      {
        message: "Oportunidad rechazada, pero falló auditoría",
        step: "insert_audit_log",
        detail: auditErr.message,
        code: (auditErr as any)?.code,
        hint: (auditErr as any)?.hint,
        opportunity: opp,
      },
      { status: 200 }
    )
  }

  // OK
  return NextResponse.json(
    { message: "Oportunidad rechazada", opportunity: { ...opp, rejection_reason: reason } },
    { status: 200 }
  )
}

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

  // 1) Marcar oportunidad como rechazada (sin rejection_reason porque no existe en OPPORTUNITY)
  const { data: opp, error: oppErr } = await supabase
    .from("OPPORTUNITY")
    .update({
      approval_status: "Rechazado",
      lifecycle_status: "Inactivo",
    })
    .eq("id", id)
    .select("id,title,approval_status,company_id,created_at,lifecycle_status")
    .single()

  if (oppErr || !opp) {
    return NextResponse.json(
      { message: "Error al rechazar oportunidad", detail: oppErr?.message },
      { status: 500 }
    )
  }

  // 2) Guardar motivo en tabla REJECT_OPPORTUNITY
  const { error: rejErr } = await supabase.from("REJECT_OPPORTUNITY").insert({
    opportunity: opp.id,
    reason,
  })

  if (rejErr) {
    return NextResponse.json(
      { message: "Oportunidad rechazada, pero falló guardar el motivo", detail: rejErr.message },
      { status: 500 }
    )
  }

  // 3) Auditoría
  await supabase.from("AUDIT_LOG").insert({
    action: "REJECT",
    entity: "OPPORTUNITY",
    entity_id: opp.id,
    company_id: opp.company_id,
    user_id: userId,
    details: {
      approval_status: opp.approval_status,
      title: opp.title,
      rejection_reason: reason,
    },
  })

  return NextResponse.json(
    { message: "Oportunidad rechazada", opportunity: { ...opp, rejection_reason: reason } },
    { status: 200 }
  )
}

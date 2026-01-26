import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { id } = await ctx.params

  const body = await req.json().catch(() => ({} as any))
  const reason = String(body?.reason ?? body?.admin_notes ?? "").trim()

  if (reason.length < 20) {
    return NextResponse.json(
      { message: "El motivo debe tener al menos 20 caracteres" },
      { status: 400 }
    )
  }

  const { data: auth } = await supabase.auth.getUser()
  let adminId: string | null = auth?.user?.id ?? null
  if (!adminId && isDev()) adminId = process.env.DEV_USER_ID ?? null

  if (!adminId) {
    return NextResponse.json({ message: "No autenticado y sin DEV_USER_ID" }, { status: 401 })
  }

  // 0) Validar que esté pending
  const { data: reqRow, error: reqErr } = await supabase
    .from("graduation_requests")
    .select("id,status,user_id")
    .eq("id", id)
    .single()

  if (reqErr || !reqRow) {
    return NextResponse.json(
      { message: "No se encontró la solicitud", detail: reqErr?.message },
      { status: 404 }
    )
  }

  if (String(reqRow.status ?? "").toLowerCase() !== "pending") {
    return NextResponse.json(
      { message: "La solicitud no está pendiente", status: reqRow.status },
      { status: 400 }
    )
  }

  const nowIso = new Date().toISOString()

  // 1) Rechazar solicitud (SOLO columnas reales)
  const { data: rejectedReq, error: updErr } = await supabase
    .from("graduation_requests")
    .update({
      status: "rejected",
      admin_notes: reason,
      updated_at: nowIso,
      // opcional: por si quedó algo de approve antes
      approved_by: null,
      approved_at: null,
    })
    .eq("id", id)
    .select("*")
    .single()

  if (updErr || !rejectedReq) {
    return NextResponse.json(
      { message: "Error rechazando solicitud", detail: updErr?.message },
      { status: 500 }
    )
  }

  // 2) Auditoría
  await supabase.from("AUDIT_LOG").insert({
    action: "REJECT_GRADUATION",
    entity: "GRADUATION_REQUEST",
    entity_id: String(rejectedReq.id),
    user_id: String(adminId),
    details: JSON.stringify({
      request_id: rejectedReq.id,
      student_id: rejectedReq.user_id,
      reason,
    }),
  })

  return NextResponse.json(
    { message: "Graduación rechazada", graduation_request: rejectedReq },
    { status: 200 }
  )
}

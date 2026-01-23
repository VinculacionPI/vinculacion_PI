import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabase()
  const { id } = await ctx.params

  const body = await req.json().catch(() => ({} as any))
  const rejection_reason = String(body?.rejection_reason ?? body?.reason ?? "").trim()

  if (rejection_reason.length < 20) {
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

  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .update({
      approval_status: "REJECTED",
      rejection_reason,
      lifecycle_status: "INACTIVE",
    })
    .eq("id", id)
    .select("id,title,approval_status,rejection_reason,company_id,created_at,lifecycle_status")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { message: "Error al rechazar oportunidad", detail: error?.message },
      { status: 500 }
    )
  }

  await supabase.from("AUDIT_LOG").insert({
    action: "REJECT",
    entity: "OPPORTUNITY",
    entity_id: data.id,
    company_id: data.company_id,
    user_id: userId,
    details: { approval_status: "REJECTED", title: data.title, rejection_reason },
  })

  return NextResponse.json({ message: "Oportunidad rechazada", opportunity: data }, { status: 200 })
}

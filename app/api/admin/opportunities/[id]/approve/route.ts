import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabase()

  const { id } = await ctx.params

  const { data: auth } = await supabase.auth.getUser()
  let userId: string | null = auth?.user?.id ?? null
  if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

  if (!userId) {
    return NextResponse.json({ message: "No autenticado y sin DEV_USER_ID" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .update({
      approval_status: "APPROVED",
      rejection_reason: null,
      lifecycle_status: "ACTIVE",
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
    details: { approval_status: "APPROVED", title: data.title },
  })

  return NextResponse.json({ message: "Oportunidad aprobada", opportunity: data }, { status: 200 })
}

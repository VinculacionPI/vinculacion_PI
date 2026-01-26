// app/api/admin/companies/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { id } = await ctx.params
  const companyId = await id

  // Obtener el motivo del body
  const body = await req.json().catch(() => ({} as any))
  const reason = String(body?.reason ?? "").trim()

  if (reason.length < 20) {
    return NextResponse.json(
      { message: "El motivo de rechazo debe tener mínimo 20 caracteres" },
      { status: 400 }
    )
  }

  // Usuario autenticado o fallback DEV
  const { data: auth } = await supabase.auth.getUser()
  let userId: string | null = auth?.user?.id ?? null
  if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

  if (!userId) {
    return NextResponse.json({ message: "No autenticado y sin DEV_USER_ID" }, { status: 401 })
  }

  // Llamar al SP reject_company_admin
  const { data, error } = await supabase.rpc("reject_company_admin", {
    p_company_id: companyId,
    p_reason: reason,
    p_user_id: userId
  })


  if (error) {
    return NextResponse.json(
      { message: "Error al ejecutar SP reject_company_admin", detail: error.message },
      { status: 500 }
    )
  }

  const code = data?.[0] ?? 0
  let message = ""
  switch (code) {
    case 1:
      message = "Empresa rechazada correctamente"
      break
    case 2:
      message = "La empresa ya había sido aprobada"
      break
    case 3:
      message = "La empresa ya estaba rechazada"
      break
    case 4:
      message = "Empresa no encontrada"
      break
    default:
      message = "Error desconocido"
  }

  return NextResponse.json({ message, code })
}

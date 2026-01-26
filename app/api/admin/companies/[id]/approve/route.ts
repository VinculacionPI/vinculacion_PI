import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { id } = await ctx.params
  const companyId = await id

  // Usuario autenticado o fallback DEV
  const { data: auth } = await supabase.auth.getUser()
  let userId: string | null = auth?.user?.id ?? null
  if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

  if (!userId) {
    return NextResponse.json(
      { message: "No autenticado y no hay configuración DEV_USER_ID" },
      { status: 401 }
    )
  }

  // Llamar al SP de aprobación
  const { data, error } = await supabase.rpc("approve_company_admin", {
    p_company_id: companyId,
    p_user_id: userId
  })

  if (error) {
    return NextResponse.json(
      { message: "Error al ejecutar SP approve_company_admin", detail: error.message },
      { status: 500 }
    )
  }

  // Interpretar códigos
  const code = Array.isArray(data) ? data[0] : data;
  let message = ""
  switch (code) {
    case 1:
      message = "Empresa aprobada correctamente"
      break
    case 2:
      message = "La empresa ya estaba aprobada"
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

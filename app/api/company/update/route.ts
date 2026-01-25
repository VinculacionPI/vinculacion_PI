import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function PUT(req: NextRequest) {
  const cookie = (await cookies()).get("company_session")

  if (!cookie) {
    return NextResponse.json(
      { message: "No autenticado" },
      { status: 401 }
    )
  }

  let session
  try {
    session = JSON.parse(cookie.value)
  } catch {
    return NextResponse.json(
      { message: "Sesión inválida" },
      { status: 401 }
    )
  }

  const companyId = session.company_id

  if (!companyId) {
    return NextResponse.json(
      { message: "Sesión inválida" },
      { status: 401 }
    )
  }

  const body = await req.json()
  const { name, sector, description, logo_path } = body

  const { supabase } = createRouteSupabase(req)

  const { data, error } = await supabase.rpc("update_company", {
    p_company_id: companyId,
    p_name: name ?? null,
    p_sector: sector ?? null,
    p_description: description ?? null,
    p_logo_path: logo_path ?? null,
  })

  if (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error al actualizar la empresa" },
      { status: 500 }
    )
  }

  // El SP retorna 0 o 1
  if (data === 0) {
    return NextResponse.json(
      { message: "No autorizado o empresa no aprobada" },
      { status: 403 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Perfil actualizado correctamente",
  })
}

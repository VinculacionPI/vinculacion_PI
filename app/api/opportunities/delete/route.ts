import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)

  // 1. Usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  // 2. Verificar empresa (company_id = user.id)
  const { data: companyData, error: companyError } = await supabase
    .from("COMPANY")
    .select("id, approval_status")
    .eq("id", user.id)
    .maybeSingle()

  if (companyError) {
    console.error("Error verificando empresa:", companyError)
    return NextResponse.json(
      { error: "Error verificando empresa" },
      { status: 500 }
    )
  }

  if (!companyData) {
    return NextResponse.json(
      { error: "Solo empresas pueden eliminar oportunidades" },
      { status: 403 }
    )
  }

  // (opcional pero recomendado)
  if (companyData.approval_status?.toLowerCase() !== "aprobada") {
    return NextResponse.json(
      { error: "La empresa debe estar aprobada" },
      { status: 403 }
    )
  }

  // 3. Leer body
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400 }
    )
  }

  const { opportunity_id } = body

  if (!opportunity_id) {
    return NextResponse.json(
      { error: "opportunity_id es obligatorio" },
      { status: 400 }
    )
  }

  // 4. Ejecutar RPC
  try {
    const { error } = await supabase.rpc("deleteopportunity", {
      p_opportunity_id: opportunity_id,
      p_company_id: companyData.id,
    })

    if (error) {
      console.error("RPC deleteopportunity error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: true,
    })
  } catch (err: any) {
    console.error("Delete opportunity exception:", err)
    return NextResponse.json(
      { error: err?.message ?? "Error desconocido" },
      { status: 500 }
    )
  }
}

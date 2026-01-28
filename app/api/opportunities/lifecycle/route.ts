import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(req: NextRequest) {
  try {
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
        { error: "Solo empresas pueden actualizar oportunidades" },
        { status: 403 }
      )
    }

    // (opcional, pero recomendado)
    if (companyData.approval_status?.toLowerCase() !== "aprobada") {
      return NextResponse.json(
        { error: "La empresa debe estar aprobada" },
        { status: 403 }
      )
    }

    // 3. Leer body
    const body = await req.json()
    const { opportunity_id, lifecycle_status } = body

    if (!opportunity_id || !lifecycle_status) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      )
    }

    // 4. Actualizar opportunity
    const { data, error } = await supabase
      .from("OPPORTUNITY")
      .update({ lifecycle_status })
      .eq("id", opportunity_id)
      .eq("company_id", companyData.id)
      .select()
      .single()

    if (error) {
      console.error("Error actualizando lifecycle:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err) {
    console.error("Error POST /opportunity/lifecycle:", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

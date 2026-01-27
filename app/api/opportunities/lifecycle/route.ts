import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(req: NextRequest) {
  try {
    // Intentar obtener la sesión de empresa
    const cookieStore = await cookies()
    const companyCookie = cookieStore.get("company_session")
    
    if (!companyCookie) {
      return NextResponse.json({ error: "No autorizado - Sin sesión de empresa" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(companyCookie.value)
    } catch (err) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    // Validar que tenga company_id
    if (!session.company_id) {
      return NextResponse.json({ error: "No autorizado - Sin company_id" }, { status: 401 })
    }

    const body = await req.json()
    const { opportunity_id, lifecycle_status } = body

    if (!opportunity_id || !lifecycle_status) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const { supabase } = createRouteSupabase(req)

    // Actualizar el estado del lifecycle
    const { data, error } = await supabase
      .from("OPPORTUNITY")
      .update({ lifecycle_status })
      .eq("id", opportunity_id)
      .eq("company_id", session.company_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
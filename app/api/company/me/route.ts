import { NextResponse, NextRequest } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function GET(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)

  // Obtener la sesión actual de Supabase Auth
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ company: null }, { status: 401 })
  }

  // Obtener company_id del user metadata
  const companyId = session.user.user_metadata?.company_id

  if (!companyId) {
    return NextResponse.json({ 
      company: null,
      message: "Usuario no tiene una empresa asociada" 
    }, { status: 404 })
  }

  // Obtener datos de la empresa
  const { data, error } = await supabase.rpc("get_company_by_id", {
    p_company_id: companyId,
  })

  if (error || !data || data.length === 0) {
    console.error("Error obteniendo empresa:", error)
    return NextResponse.json({ 
      company: null,
      message: "Empresa no encontrada" 
    }, { status: 404 })
  }

  return NextResponse.json({
    company: data[0],
  })
}
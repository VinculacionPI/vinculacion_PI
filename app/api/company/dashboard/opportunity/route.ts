import { NextResponse, NextRequest } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function GET(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)

  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ opportunities: [] }, { status: 401 })
  }

  // Verificar que sea empresa
  const role = user.user_metadata?.role
  if (role !== 'company') {
    return NextResponse.json({ opportunities: [] }, { status: 403 })
  }

  const companyId = user.user_metadata?.company_id
  if (!companyId) {
    return NextResponse.json({ opportunities: [] }, { status: 401 })
  }

  const { data, error } = await supabase.rpc("getcompanyopportunities", {
    p_company_id: companyId,
  })

  if (error) {
    console.error("Error SP getcompanyopportunities:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ opportunities: data ?? [] })
}

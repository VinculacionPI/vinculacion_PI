import { NextResponse, NextRequest } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase()

  // 1. Obtener usuario logueado desde Supabase
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Verificar que sea una empresa y obtener company_id
  // El company_id ES el mismo que el user.id en tu arquitectura
  const { data: companyData, error: companyError } = await supabase
    .from("COMPANY")
    .select("id, approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!companyData) {
    return NextResponse.json({ 
      error: "No autorizado." 
    }, { status: 403 });
  }

  const companyId = companyData.id

  const { data, error } = await supabase.rpc("getcompanyopportunities", {
    p_company_id: companyId,
  })

  if (error) {
    console.error("Error SP getcompanyopportunities:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ opportunities: data ?? [] })
}

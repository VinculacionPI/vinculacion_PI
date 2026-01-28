import { NextResponse, NextRequest } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function GET(req: NextRequest) {
  const { supabase } = createRouteSupabase(req);

  // Obtener usuario logueado desde Supabase
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

  if (companyError) {
    console.error("Error verificando empresa:", companyError);
    return NextResponse.json({ error: "Error al verificar empresa" }, { status: 500 });
  }

  if (!companyData) {
    return NextResponse.json({ 
      error: "No autorizado. Solo las empresas pueden crear pasantías." 
    }, { status: 403 });
  }

  if (companyData.approval_status.toLowerCase() !== "aprobada") {
    return NextResponse.json({ 
      error: "Tu empresa debe estar aprobada para crear pasantías" 
    }, { status: 403 });
  }

  const companyId = companyData.id;

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
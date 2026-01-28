import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function PUT(req: NextRequest) {
  const { supabase } = createRouteSupabase(req);

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

  if (companyError) {
    console.error("Error verificando empresa:", companyError);
    return NextResponse.json({ error: "Error al verificar empresa" }, { status: 500 });
  }

  if (!companyData) {
    return NextResponse.json({ 
      error: "No autorizado. Solo las empresas pueden crear empleos." 
    }, { status: 403 });
  }

  if (companyData.approval_status.toLowerCase() !== "aprobada") {
    return NextResponse.json({ 
      error: "Tu empresa debe estar aprobada para crear oportunidades" 
    }, { status: 403 });
  }

  const companyId = companyData.id;

  // Obtener datos del body
  const body = await req.json().catch(() => ({}))
  const { name, sector, description, logo_path } = body

  // Validación básica (opcional)
  if (!name && !sector && !description && !logo_path) {
    return NextResponse.json(
      { message: "Debes proporcionar al menos un campo para actualizar" },
      { status: 400 }
    )
  }

  // Actualizar empresa usando el stored procedure
  const { data, error } = await supabase.rpc("update_company", {
    p_company_id: companyId,
    p_name: name ?? null,
    p_sector: sector ?? null,
    p_description: description ?? null,
    p_logo_path: logo_path ?? null,
  })

  if (error) {
    console.error("Error actualizando empresa:", error)
    return NextResponse.json(
      { message: "Error al actualizar la empresa", detail: error.message },
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
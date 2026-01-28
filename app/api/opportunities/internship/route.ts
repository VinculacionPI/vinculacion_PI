// app/api/opportunities/internship/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(req: NextRequest) {
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

  // Leer body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    i_id,
    i_title,
    i_type,
    i_description,
    i_mode,
    i_area,
    i_requirements,
    i_contact,
    i_duration,
    i_schedule,
    i_remuneration,
    i_flyer_url,
  } = body;

  try {
    const remunerationValue =
      i_remuneration !== null && i_remuneration !== undefined
        ? typeof i_remuneration === "string"
          ? parseFloat(i_remuneration.replace(/[^\d.-]/g, ""))
          : i_remuneration
        : null;

    const { data, error } = await supabase.rpc("createupdateinternship", {
      i_id: i_id ?? null,
      i_title,
      i_type,
      i_description,
      i_mode,
      i_area,
      i_requirements,
      i_contact,
      i_duration,
      i_schedule,
      i_remuneration: remunerationValue,
      i_company_id: companyId,
      i_flyer_url: i_flyer_url ?? null,
    });

    if (error) {
      console.error("RPC createupdateinternship error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      opportunity_id: data,
      action: i_id ? "updated" : "created",
    });
  } catch (err: any) {
    console.error("Excepción createupdateinternship:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}

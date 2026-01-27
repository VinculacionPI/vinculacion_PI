import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = user.user_metadata?.role;
  if (role !== 'company') {
    return NextResponse.json({ error: "Solo empresas pueden crear pasantías" }, { status: 403 });
  }

  const companyId = user.user_metadata?.company_id;
  if (!companyId) {
    return NextResponse.json({ error: "No se encontró company_id" }, { status: 401 });
  }

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

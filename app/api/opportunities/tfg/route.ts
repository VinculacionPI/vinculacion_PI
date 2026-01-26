import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(req: NextRequest) {
  const cookie = (await cookies()).get("company_session");
  if (!cookie) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let session;
  try { session = JSON.parse(cookie.value); } 
  catch { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }

  const companyId = session.company_id;
  if (!companyId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { supabase } = createRouteSupabase(req);

  let body;
  try { body = await req.json(); } 
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

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
    const remunerationValue = i_remuneration
      ? typeof i_remuneration === "string"
        ? parseFloat(i_remuneration.replace(/[^\d.-]/g, ""))
        : i_remuneration
      : null;

    // Llamar la función RPC con los parámetros en el orden correcto
    const { data, error } = await supabase.rpc("createupdatetfg", {
      i_id: i_id ?? null,
      i_title: i_title,
      i_type: i_type,
      i_description: i_description,
      i_mode: i_mode,
      i_area: i_area,
      i_requirements: i_requirements,
      i_contact: i_contact,
      i_duration: i_duration,
      i_schedule: i_schedule,
      i_remuneration: remunerationValue,
      i_company_id: companyId,
      i_flyer_url: i_flyer_url ?? null,
    });

    if (error) {
      console.error("RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      opportunity_id: data,
      action: i_id ? "updated" : "created",
    });

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message ?? "Error desconocido" }, { status: 500 });
  }
}
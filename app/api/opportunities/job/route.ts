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
    j_id,
    j_title,
    j_type,
    j_description,
    j_mode,
    j_requirements,
    j_contact_info,
    j_contract_type,
    j_salary_min,
    j_salary_max,
    j_benefits,
    j_estimated_start_date,
    j_flyer_url,
  } = body;

  if (!j_contact_info) return NextResponse.json({ error: "contact_info es obligatorio" }, { status: 400 });

  try {
    const { data, error } = await supabase.rpc("createupdatejob", {
      j_id: j_id ?? null,
      j_title,
      j_type,
      j_description,
      j_mode,
      j_requirements: j_requirements || "",
      j_contact_info,
      j_contract_type,
      j_salary_min: j_salary_min ? parseFloat(j_salary_min.toString().replace(/[^\d.-]/g,'')) : 0,
      j_salary_max: j_salary_max ? parseFloat(j_salary_max.toString().replace(/[^\d.-]/g,'')) : 0,
      j_benefits,
      j_estimated_start_date,
      j_company_id: companyId,
      j_flyer_url: j_flyer_url ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ opportunity_id: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Error desconocido" }, { status: 500 });
  }
}

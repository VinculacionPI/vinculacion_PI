// app/api/opportunities/job/route.ts
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
    return NextResponse.json({ error: "Solo empresas pueden crear empleos" }, { status: 403 });
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
    j_id,
    j_title,
    j_type,
    j_description,
    j_mode,
    j_area,
    j_requirements,
    j_contact_info,
    j_contract_type,
    j_salary_min,
    j_salary_max,
    j_benefits,
    j_estimated_start_date,
    j_flyer_url,
  } = body;

  if (!j_contact_info) {
    return NextResponse.json(
      { error: "contact_info es obligatorio" },
      { status: 400 }
    );
  }

  try {
    const salaryMinValue =
      j_salary_min !== null && j_salary_min !== undefined
        ? typeof j_salary_min === "string"
          ? parseFloat(j_salary_min.replace(/[^\d.-]/g, ""))
          : j_salary_min
        : null;

    const salaryMaxValue =
      j_salary_max !== null && j_salary_max !== undefined
        ? typeof j_salary_max === "string"
          ? parseFloat(j_salary_max.replace(/[^\d.-]/g, ""))
          : j_salary_max
        : null;

    const { data, error } = await supabase.rpc("createupdatejob", {
      j_id: j_id ?? null,
      j_title,
      j_type,
      j_description,
      j_mode,
      j_area,
      j_requirements: j_requirements ?? "",
      j_contact_info,
      j_contract_type,
      j_salary_min: salaryMinValue,
      j_salary_max: salaryMaxValue,
      j_benefits,
      j_estimated_start_date,
      j_company_id: companyId,
      j_flyer_url: j_flyer_url ?? null,
    });

    if (error) {
      console.error("RPC createupdatejob error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      opportunity_id: data,
      action: j_id ? "updated" : "created",
    });
  } catch (err: any) {
    console.error("Excepción createupdatejob:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}
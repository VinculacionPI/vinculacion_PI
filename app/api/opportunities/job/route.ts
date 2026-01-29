// app/api/opportunities/job/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(req: NextRequest) {
  const { supabase } = createRouteSupabase(req);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: companyData, error: companyError } = await supabase
    .from("COMPANY")
    .select("id, approval_status, name")
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

    const opportunityId = data;
    const isNewOpportunity = !j_id;

    // Notificar a administradores cuando se CREA (no edita)
    if (isNewOpportunity) {
      try {
        const { data: admins } = await supabase
          .from('USERS')
          .select('id')
          .eq('role', 'ADMIN')

        if (admins && admins.length > 0) {
          const adminNotifications = admins.map(admin => ({
            user_id: admin.id,
            type: 'PENDING_APPROVAL',
            title: 'Nueva oferta de empleo pendiente',
            message: `${companyData.name} publicó "${j_title}" - Requiere aprobación`,
            entity_type: 'opportunity',
            entity_id: opportunityId,
            is_read: false,
            created_at: new Date().toISOString()
          }))

          await supabase.from('NOTIFICATION').insert(adminNotifications)
          console.log(`Notificación enviada a ${admins.length} administradores`)
        }
      } catch (notifError) {
        console.warn('Error creando notificaciones admin:', notifError)
      }
    }

    console.log("Empleo creado/actualizado exitosamente:", opportunityId);

    return NextResponse.json({
      success: true,
      opportunity_id: opportunityId,
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
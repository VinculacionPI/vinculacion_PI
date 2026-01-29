// app/api/opportunities/tfg/route.ts
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
      error: "No autorizado. Solo las empresas pueden crear proyectos." 
    }, { status: 403 });
  }

  if (companyData.approval_status.toLowerCase() !== "aprobada") {
    return NextResponse.json({ 
      error: "Tu empresa debe estar aprobada para crear proyectos" 
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

    const { data, error } = await supabase.rpc("createupdatetfg", {
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
      console.error("RPC createupdatetfg error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const opportunityId = data;
    const isNewOpportunity = !i_id;

    if (isNewOpportunity) {
      try {
        console.log('Buscando administradores...')
        
        const { data: admins, error: adminError } = await supabase
          .from('USERS')
          .select('id')
          .eq('role', 'ADMIN')

        console.log('Admins encontrados:', admins?.length || 0)
        console.log('Error admin:', adminError)

        if (admins && admins.length > 0) {
          const adminNotifications = admins.map(admin => ({
            user_id: admin.id,
            type: 'PENDING_APPROVAL',
            title: 'Nuevo proyecto pendiente',
            message: companyData.name + ' publico "' + i_title + '" - Requiere aprobacion',
            entity_type: 'opportunity',
            entity_id: opportunityId,
            is_read: false,
            created_at: new Date().toISOString()
          }))

          const { error: insertError } = await supabase.from('NOTIFICATION').insert(adminNotifications)
          
          if (insertError) {
            console.error('Error insertando notificaciones:', insertError)
          } else {
            console.log('Notificaciones enviadas a ' + admins.length + ' administradores')
          }
        }
      } catch (notifError) {
        console.warn('Error creando notificaciones admin:', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      opportunity_id: opportunityId,
      action: i_id ? "updated" : "created",
    });

  } catch (err: any) {
    console.error("Excepcion createupdatetfg:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}

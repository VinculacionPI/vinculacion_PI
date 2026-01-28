import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function DELETE(req: NextRequest) {

  try {
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
      error: "No autorizado." 
    }, { status: 403 });
  }
  const companyId = companyData.id;

    // 4. Ejecutar stored procedure para eliminar empresa
    const { data, error } = await supabase.rpc("delete_company", {
      p_company_id: companyId
    })

    if (error) {
      console.error("Error SP delete_company:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // 5. Manejar respuesta del stored procedure
    // data puede ser 0, 1 o 2 según tu SP
    switch (data) {
      case 0:
        return NextResponse.json(
          { error: "No se encontró la empresa o no tienes permisos" },
          { status: 403 }
        )
      case 1:
        // Eliminación exitosa - cerrar sesión del usuario
        await supabase.auth.signOut()
        
        return NextResponse.json({
          message: "Empresa eliminada correctamente",
          ok: true
        })
      case 2:
        return NextResponse.json(
          { 
            error: "La empresa tiene oportunidades activas y no se puede eliminar",
            detail: "Debes eliminar o cerrar todas las oportunidades antes de eliminar la empresa"
          },
          { status: 400 }
        )
      default:
        console.error("Respuesta inesperada del SP:", data)
        return NextResponse.json(
          { error: "Respuesta inesperada del servidor" },
          { status: 500 }
        )
    }
  } catch (err: any) {
    console.error("Error en DELETE /api/company:", err)
    return NextResponse.json(
      { error: err.message || "Error inesperado" },
      { status: 500 }
    )
  }
}
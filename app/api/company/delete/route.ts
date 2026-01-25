import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export const DELETE = async (req: NextRequest) => {
  try {
    const { company_id } = await req.json();

    if (!company_id) {
      return NextResponse.json({ error: "Falta el company_id" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("delete_company", { p_company_id: company_id });

    if (error) {
      console.error("Error SP delete_company:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // data puede ser 0, 1 o 2 según tu SP
    switch (data) {
      case 0:
        return NextResponse.json({ error: "No se encontró la empresa o no eres el owner" }, { status: 400 });
      case 1:
        return NextResponse.json({ message: "Empresa eliminada correctamente" });
      case 2:
        return NextResponse.json({ error: "La empresa tiene oportunidades activas y no se puede eliminar" }, { status: 400 });
      default:
        return NextResponse.json({ error: "Respuesta inesperada del servidor" }, { status: 500 });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Error inesperado" }, { status: 500 });
  }
};

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(req: NextRequest) {
  const cookie = (await cookies()).get("company_session");
  if (!cookie) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let session;
  try {
    session = JSON.parse(cookie.value);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const companyId = session.company_id;
  if (!companyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { supabase } = createRouteSupabase(req);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { opportunity_id } = body;

  if (!opportunity_id) {
    return NextResponse.json(
      { error: "opportunity_id es obligatorio" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase.rpc("deleteopportunity", {
      p_opportunity_id: opportunity_id,
      p_company_id: companyId,
    });

    if (error) {
      console.error("RPC deleteopportunity error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (err: any) {
    console.error("Delete opportunity exception:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}

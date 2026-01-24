import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(req: NextRequest) {
  const { supabase, res } = createRouteSupabase(req);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { message: "Error al cerrar sesión", detail: error.message },
      { status: 500 }
    );
  }

  // Response final
  const out = NextResponse.json({ ok: true }, { status: 200 });

  // Copiar Set-Cookie del “res” (donde supabase escribió cookies) al response final
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) out.headers.set("set-cookie", setCookie);

  return out;
}
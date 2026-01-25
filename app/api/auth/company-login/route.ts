import { createRouteSupabase } from "@/lib/supabase/route"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)
  const { email, password } = await req.json()

  const { data, error } = await supabase.rpc("logincompany", {
    p_email: email,
    p_password: password,
  })

  if (error || !data?.length) {
    return NextResponse.json(
      { message: "Credenciales inválidas" },
      { status: 401 }
    )
  }

  const result = data[0]

  if (result.status === 2) {
    return NextResponse.json(
      { message: "La empresa aún no ha sido aprobada" },
      { status: 403 }
    )
  }

  if (result.status !== 1) {
    return NextResponse.json(
      { message: "Credenciales inválidas" },
      { status: 402 }
    )
  }

  const res = NextResponse.json({ ok: true })

  res.cookies.set("company_session", JSON.stringify({
    company_id: result.company_id,
    name: result.name,
    email: result.email,
    role: "company",
  }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })

  return res
}

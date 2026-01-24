import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(req: NextRequest) {
  const { supabase, res } = createRouteSupabase(req)

  const body = await req.json().catch(() => ({}))
  const email = String(body?.email ?? "").trim()
  const password = String(body?.password ?? "").trim()

  if (!email || !password) {
    return NextResponse.json({ message: "Email y contraseña requeridos" }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return NextResponse.json(
      { message: "Credenciales inválidas", detail: error?.message },
      { status: 401 }
    )
  }

  // Response final
  const out = NextResponse.json(
    { ok: true, user: { id: data.user.id, email: data.user.email } },
    { status: 200 }
  )

  // Copiar Set-Cookie del “res” (donde supabase escribió cookies) al response final
  const setCookie = res.headers.get("set-cookie")
  if (setCookie) out.headers.set("set-cookie", setCookie)

  return out
}

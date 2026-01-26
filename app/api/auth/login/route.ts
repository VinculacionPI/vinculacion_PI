import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(req: NextRequest) {
  const { supabase, res } = createRouteSupabase(req)

  const body = await req.json().catch(() => ({}))
  const email = String(body?.email ?? "").trim()
  const password = String(body?.password ?? "").trim()

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email y contraseña requeridos" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  //  LOGIN FALLÓ
  if (error || !data?.session) {
    //  LOG CLAVE PARA DEBUG (sale en la terminal)
    console.error("LOGIN ERROR SUPABASE:", {
      email,
      code: error?.code,
      message: error?.message,
      status: error?.status,
    })

    // Mensaje más humano según el error real
    let message = "Credenciales inválidas"

    if (error?.message?.toLowerCase().includes("email not confirmed")) {
      message = "Debes confirmar tu correo antes de iniciar sesión"
    }

    if (error?.message?.toLowerCase().includes("invalid login credentials")) {
      message = "Correo o contraseña incorrectos"
    }

    if (error?.message?.toLowerCase().includes("too many")) {
      message = "Demasiados intentos. Intenta más tarde"
    }

    return NextResponse.json(
      {
        message,
        detail: error?.message,
        code: error?.code,
      },
      { status: 401 }
    )
  }

  // LOGIN OK
  const role = data.user.user_metadata?.role || "student"
  const company_id = data.user.user_metadata?.company_id || null

  console.log("Login exitoso:", {
    email: data.user.email,
    role,
    company_id,
  })

  const out = NextResponse.json(
    {
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        company_id,
      },
      role, 
    },
    { status: 200 }
  )

  // Copiar cookies de Supabase 
  const setCookie = res.headers.get("set-cookie")
  if (setCookie) out.headers.set("set-cookie", setCookie)

  return out
}

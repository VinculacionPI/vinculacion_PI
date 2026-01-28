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

  // LOGIN OK - Check user status
  const role = data.user.user_metadata?.role || "student"
  const company_id = data.user.user_metadata?.company_id || null

  // Check if user status is active
  const { data: userData, error: userError } = await supabase
    .from("USERS")
    .select("status")
    .eq("id", data.user.id)
    .single()

  if (userError || !userData) {
    console.error("Error fetching user status:", userError)
    return NextResponse.json(
      { message: "Error al verificar el estado del usuario" },
      { status: 500 }
    )
  }

  // Block login if status is not active
  if (userData.status.toLowerCase() !== "active") {
    
    let statusMessage = "Tu cuenta no está activa"
    if (userData.status.toLowerCase() === "pending") {
      // Custom message for graduates
      if (role === "graduate") {
        statusMessage = "Su solicitud está pendiente, actualmente está siendo procesada."
      } else {
        statusMessage = "Tu cuenta está pendiente de aprobación por un administrador"
      }
    } else if (userData.status.toLowerCase() === "suspended") {
      statusMessage = "Tu cuenta ha sido suspendida. Contacta al administrador"
    } else if (userData.status.toLowerCase() === "rejected") {
      statusMessage = "Tu solicitud de registro fue rechazada"
    }

    return NextResponse.json(
      { message: statusMessage, status: userData.status },
      { status: 403 }
    )
  }

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

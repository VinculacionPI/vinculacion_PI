import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

// LOGIN PARA EMPRESAS
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

  // LOGIN FALLÓ
  if (error || !data?.session) {
    console.error("LOGIN ERROR SUPABASE:", {
      email,
      code: error?.code,
      message: error?.message,
      status: error?.status,
    })

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

  // Verificar que la empresa exista en la tabla COMPANY
  const { data: companyData, error: companyError } = await supabase
    .from("COMPANY")
    .select("id, name, approval_status")
    .eq("id", data.user.id)
    .maybeSingle()

  if (companyError) {
    console.error("Error fetching company:", companyError)
    return NextResponse.json(
      { message: "Error al verificar la empresa" },
      { status: 500 }
    )
  }

  // Si no existe en COMPANY, no es una empresa válida
  if (!companyData) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { message: "Esta cuenta no es de empresa. Por favor usa el login de usuarios." },
      { status: 403 }
    )
  }

  // Verificar approval_status
  if (companyData.approval_status.toLowerCase() !== "aprobada") {    
    let statusMessage = "Tu empresa no está aprobada"
    if (companyData.approval_status.toLowerCase() === "pendiente") {
      statusMessage = "Tu empresa está pendiente de aprobación por un administrador"
    } else if (companyData.approval_status.toLowerCase() === "rechazada") {
      statusMessage = "Tu solicitud de empresa fue rechazada"
    }

    await supabase.auth.signOut()

    return NextResponse.json(
      { message: statusMessage, status: companyData.approval_status },
      { status: 403 }
    )
  }

  const out = NextResponse.json(
    {
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: "company",
        company_id: companyData.id,
      },
      role: "company",
    },
    { status: 200 }
  )

  // Copiar cookies de Supabase
  const setCookieHeaders = res.headers.getSetCookie()
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    setCookieHeaders.forEach(cookie => {
      out.headers.append("set-cookie", cookie)
    })
  }

  return out
}
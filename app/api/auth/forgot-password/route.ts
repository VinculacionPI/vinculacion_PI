import { type NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteSupabase(request)
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: "Email es requerido" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Email inválido" }, { status: 400 })
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      console.error("[Forgot password] Supabase error:", error)
      
      if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
        return NextResponse.json(
          { message: "Demasiados intentos. Espera unos minutos." },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { message: "Error al enviar código de recuperación" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Código enviado. Revisa tu correo." },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Forgot password] Error:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

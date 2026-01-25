import { type NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteSupabase(request)
    const { email, otp, password } = await request.json()

    if (!email || !otp || !password) {
      return NextResponse.json(
        { message: "Email, código y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "magiclink",
    })

    if (verifyError) {
      console.error("[Reset password] Verify OTP error:", verifyError)
      
      if (verifyError.message.includes("expired")) {
        return NextResponse.json(
          { message: "El código ha expirado. Solicita uno nuevo." },
          { status: 400 }
        )
      }
      
      if (verifyError.message.includes("invalid")) {
        return NextResponse.json(
          { message: "Código inválido. Verifica e intenta de nuevo." },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { message: "Error al verificar el código" },
        { status: 400 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { message: "No se pudo establecer la sesión" },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      console.error("[Reset password] Update password error:", updateError)
      return NextResponse.json(
        { message: "Error al actualizar contraseña" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Contraseña actualizada exitosamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Reset password] Error:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

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

  // 1️⃣ Login con Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 })
  }

  const userId = authData.user.id

  // 2️⃣ Buscar empresa asociada
  const { data: companyData, error: companyError } = await supabase
    .from("COMPANY")
    .select("id, name, email, approval_status, logo_path, sector")
    .eq("id", userId) // Asegúrate que `p_id` = `userId` al registrar
    .maybeSingle()

  if (companyError || !companyData) {
    return NextResponse.json({ message: "Empresa no encontrada" }, { status: 404 })
  }

  if (companyData.approval_status !== "Aprobada") {
    return NextResponse.json(
      { message: `La empresa aún no ha sido aprobada (${companyData.approval_status})` },
      { status: 403 }
    )
  }

  // 3️⃣ Crear cookie de sesión
  const out = NextResponse.json({
    ok: true,
    role: "company",
    company: {
      id: companyData.id,
      name: companyData.name,
      email: companyData.email,
      logo_path: companyData.logo_path,
      sector: companyData.sector,
    },
  })

  out.cookies.set(
    "company_session",
    JSON.stringify({
      company_id: companyData.id,
      name: companyData.name,
      email: companyData.email,
      role: "company",
    }),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 }
  )

  return out
}

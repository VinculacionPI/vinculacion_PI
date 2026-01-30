import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

export async function GET(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 })
  }

  const { data: userData, error: dbError } = await supabase
    .from("USERS")
    .select("id, name, email, role, status, cedula, phone, personalEmail, carnet, semester, address, created_at")
    .eq("id", user.id)
    .single()

  if (dbError || !userData) {
    console.error("[Profile] Database error:", dbError)
    return NextResponse.json({ message: "Error al obtener perfil", detail: dbError?.message }, { status: 500 })
  }

  // ✅ Guard: si está inactivo, no debería usar el sistema
  if (norm(userData.status) !== "ACTIVE") {
    return NextResponse.json({ message: "Cuenta inactiva" }, { status: 403 })
  }

  return NextResponse.json(
    {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      cedula: userData.cedula,
      phone: userData.phone,
      personalEmail: userData.personalEmail,
      carnet: userData.carnet,
      semester: userData.semester,
      address: userData.address,
      createdAt: userData.created_at,
    },
    { status: 200 }
  )
}

export async function PUT(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 })
  }

  // ✅ Guard: si está inactivo, no permitir updates
  const { data: me, error: meErr } = await supabase
    .from("USERS")
    .select("status")
    .eq("id", user.id)
    .single()

  if (meErr) {
    return NextResponse.json({ message: "Error validando estado", detail: meErr.message }, { status: 500 })
  }
  if (norm(me?.status) !== "ACTIVE") {
    return NextResponse.json({ message: "Cuenta inactiva" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, cedula, phone, personalEmail, carnet, semester, address } = body

    if (!name || !cedula || !phone) {
      return NextResponse.json({ message: "Nombre, cédula y teléfono son requeridos" }, { status: 400 })
    }

    const { data, error: dbError } = await supabase
      .from("USERS")
      .update({
        name,
        cedula,
        phone,
        personalEmail: personalEmail || null,
        carnet: carnet || null,
        semester: semester || null,
        address: address || null,
      })
      .eq("id", user.id)
      .select()
      .single()

    if (dbError) {
      console.error("[Profile Update] Database error:", dbError)
      return NextResponse.json({ message: "Error al actualizar perfil", detail: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Perfil actualizado exitosamente", profile: data }, { status: 200 })
  } catch (error) {
    console.error("[Profile Update] Error:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 })
  }

  // (Opcional) Asegurar que solo graduate pueda “desactivarse”
  const { data: me, error: meErr } = await supabase
    .from("USERS")
    .select("role, status")
    .eq("id", user.id)
    .single()

  if (meErr || !me) {
    return NextResponse.json({ message: "Perfil no encontrado" }, { status: 404 })
  }

  if (norm(me.role) !== "GRADUATE") {
    return NextResponse.json({ message: "Acción no permitida para este rol" }, { status: 403 })
  }

  // Si ya está inactivo, responde ok (idempotente)
  if (norm(me.status) === "INACTIVE") {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const { error: updErr } = await supabase
    .from("USERS")
    .update({ status: "INACTIVE" })
    .eq("id", user.id)

  if (updErr) {
    return NextResponse.json({ message: "No se pudo desactivar", detail: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

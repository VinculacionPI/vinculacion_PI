import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function GET(req: NextRequest) {
  const { supabase } = createRouteSupabase(req)

  // Obtener el usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 })
  }

  // Obtener datos adicionales del usuario desde la tabla users
  const { data: userData, error: dbError } = await supabase
    .from("USERS")
    .select("id, name, email, role, status, cedula, phone, personalEmail, carnet, semester, address, created_at")
    .eq("id", user.id)
    .single()

  if (dbError) {
    console.error("[Profile] Database error:", dbError)
    return NextResponse.json({ message: "Error al obtener perfil", detail: dbError.message }, { status: 500 })
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

  // Obtener el usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, cedula, phone, personalEmail, carnet, semester, address } = body

    // Validar campos requeridos
    if (!name || !cedula || !phone) {
      return NextResponse.json(
        { message: "Nombre, cédula y teléfono son requeridos" },
        { status: 400 }
      )
    }

    // Actualizar datos del usuario en la tabla users
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
      return NextResponse.json(
        { message: "Error al actualizar perfil", detail: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: "Perfil actualizado exitosamente",
        profile: data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Profile Update] Error:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

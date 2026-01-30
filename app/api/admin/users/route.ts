import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase()

  const url = new URL(req.url)
  const role = norm(url.searchParams.get("role")) // STUDENT | GRADUATE | ALL | ""

  let q = supabase
    .from("USERS")
    .select("id, name, email, cedula, carnet, semester, role, status, created_at")
    .order("created_at", { ascending: false })

  if (role && role !== "ALL") {
    // solo permitimos estos roles por seguridad
    if (role !== "STUDENT" && role !== "GRADUATE") {
      return NextResponse.json({ message: "role inválido" }, { status: 400 })
    }
    q = q.eq("role", role.toLowerCase())
 // en tu DB guardas "student"/"graduate"
  }

  const { data, error } = await q

  if (error) {
    console.error("ERROR GET USERS", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [], { status: 200 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabase()

  try {
    const body = await req.json().catch(() => null)
    const userId = body?.userId as string | undefined
    const statusRaw = body?.status as string | undefined

    const status = norm(statusRaw) // ACTIVE | INACTIVE

    if (!userId) {
      return NextResponse.json({ message: "userId es requerido" }, { status: 400 })
    }
    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return NextResponse.json({ message: "status inválido (ACTIVE/INACTIVE)" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("USERS")
      .update({ status })
      .eq("id", userId)
      .select("id, status")
      .single()

    if (error) {
      console.error("ERROR PATCH USER STATUS", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, user: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "Error interno" }, { status: 500 })
  }
}

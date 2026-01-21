import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function GET() {
  const supabase = createServerSupabase()

  // Intentar auth normal
  const { data: auth } = await supabase.auth.getUser()
  let companyId: string | null = null

  if (auth?.user?.id) {
    const { data: company } = await supabase
      .from("COMPANY")
      .select("id")
      .eq("owner", auth.user.id)
      .single()

    companyId = company?.id ?? null
  }

  // Fallback dev
  if (!companyId && isDev()) {
    companyId = process.env.DEV_COMPANY_ID ?? null
  }

  if (!companyId) {
    return NextResponse.json({ message: "Empresa no encontrada o no autenticado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .select("*")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ message: "Error al obtener oportunidades", detail: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [], { status: 200 })
}

export async function POST(req: Request) {
  const supabase = createServerSupabase()
  const body = await req.json()

  const {
    title,
    description,
    type,
    mode,
    duration_estimated,
    requirements,
    contact_info,
  } = body

  const missing = {
    title: !title || !title.trim(),
    description: !description || !description.trim(),
    description_length: description?.trim()?.length ?? 0,
    type: !type,
    mode: !mode,
    duration_estimated: !duration_estimated || !duration_estimated.trim(),
    requirements: !requirements || !requirements.trim(),
    contact_info: !contact_info || !contact_info.trim(),
  }

  const hasErrors =
    missing.title ||
    missing.description ||
    missing.description_length < 100 ||
    missing.type ||
    missing.mode ||
    missing.duration_estimated ||
    missing.requirements ||
    missing.contact_info

  if (hasErrors) {
    return NextResponse.json(
      { message: "Campos requeridos faltantes o inválidos", missing },
      { status: 400 }
    )
  }

  // Resolver company_id
  const { data: auth } = await supabase.auth.getUser()
  let userId: string | null = auth?.user?.id ?? null
  let companyId: string | null = null

  if (userId) {
    const { data: company } = await supabase
      .from("COMPANY")
      .select("id")
      .eq("owner", userId)
      .single()

    companyId = company?.id ?? null
  }

  // Fallback dev si no hay sesión o no hay company asociada
  if ((!userId || !companyId) && isDev()) {
    companyId = process.env.DEV_COMPANY_ID ?? companyId
    userId = process.env.DEV_USER_ID ?? userId
  }

  if (!companyId || !userId) {
    return NextResponse.json(
      { message: "No autenticado y no hay configuración de DEV_COMPANY_ID/DEV_USER_ID" },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .insert({
      title: title.trim(),
      description: description.trim(),
      type,
      mode,
      duration_estimated: duration_estimated.trim(),
      requirements: requirements.trim(),
      contact_info: contact_info.trim(),
      status: "OPEN",
      approval_status: "PENDING",
      lifecycle_status: "ACTIVE",
      company_id: companyId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { message: "Error al crear la oportunidad", detail: error.message },
      { status: 500 }
    )
  }

  // Auditoría (si userId está definido)
  await supabase.from("AUDIT_LOG").insert({
    action: "CREATION",
    entity: "OPPORTUNITY",
    entity_id: data.id,
    company_id: companyId,
    user_id: userId,
    details: { title: data.title, type: data.type },
  })

  return NextResponse.json(data, { status: 201 })
}

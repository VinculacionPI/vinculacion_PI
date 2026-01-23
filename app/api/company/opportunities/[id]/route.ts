import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const supabase = createServerSupabase()

  // IMPORTANTE: params es Promise
  const { id } = await ctx.params

  const body = await req.json().catch(() => ({} as any))

  const {
    title,
    description,
    type,
    mode,
    duration_estimated,
    requirements,
    contact_info,
  } = body

  // Validación básica
  const missing = {
    title: !title || !String(title).trim(),
    description: !description || !String(description).trim(),
    description_length: String(description ?? "").trim().length,
    type: !type,
    mode: !mode,
    duration_estimated: !duration_estimated || !String(duration_estimated).trim(),
    requirements: !requirements || !String(requirements).trim(),
    contact_info: !contact_info || !String(contact_info).trim(),
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

  // Resolver empresa del usuario (o fallback dev)
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

  if ((!userId || !companyId) && isDev()) {
    companyId = process.env.DEV_COMPANY_ID ?? companyId
    userId = process.env.DEV_USER_ID ?? userId
  }

  if (!companyId || !userId) {
    return NextResponse.json(
      { message: "No autenticado y no hay configuración DEV_COMPANY_ID/DEV_USER_ID" },
      { status: 401 }
    )
  }

  // Verificar pertenencia
  const { data: existing, error: existingError } = await supabase
    .from("OPPORTUNITY")
    .select("id, company_id")
    .eq("id", id)
    .single()

  if (existingError || !existing) {
    return NextResponse.json({ message: "Oportunidad no encontrada" }, { status: 404 })
  }

  if (existing.company_id !== companyId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 })
  }

  // Update
  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .update({
      title: String(title).trim(),
      description: String(description).trim(),
      type,
      mode,
      duration_estimated: String(duration_estimated).trim(),
      requirements: String(requirements).trim(),
      contact_info: String(contact_info).trim(),
    })
    .eq("id", id)
    .select("id,title,description,type,mode,duration_estimated,requirements,contact_info,approval_status,lifecycle_status,created_at")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { message: "Error al actualizar la oportunidad", detail: error?.message },
      { status: 500 }
    )
  }

  // Auditoría
  await supabase.from("AUDIT_LOG").insert({
    action: "UPDATE",
    entity: "OPPORTUNITY",
    entity_id: id,
    company_id: companyId,
    user_id: userId,
    details: { title: data.title, type: data.type },
  })

  return NextResponse.json(data, { status: 200 })
}

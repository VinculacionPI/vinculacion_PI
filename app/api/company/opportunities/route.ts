import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

async function resolveCompanyId(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>
) {
  // Intentar auth normal
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

  // Fallback dev
  if ((!userId || !companyId) && isDev()) {
    companyId = process.env.DEV_COMPANY_ID ?? companyId
    userId = process.env.DEV_USER_ID ?? userId
  }

  return { userId, companyId }
}

export async function GET() {
  const supabase = await createServerSupabase()

  const { companyId } = await resolveCompanyId(supabase)

  if (!companyId) {
    return NextResponse.json(
      { message: "Empresa no encontrada o no autenticado" },
      { status: 401 }
    )
  }

  // Nota: tu schema OPPORTUNITY NO tiene deleted_at. Quité ese filtro.
  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      { message: "Error al obtener oportunidades", detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data ?? [], { status: 200 })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const body = await req.json().catch(() => ({} as any))

  const { title, description, type, mode, duration_estimated, requirements, contact_info } = body

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

  const { userId, companyId } = await resolveCompanyId(supabase)

  if (!companyId || !userId) {
    return NextResponse.json(
      { message: "No autenticado y no hay configuración de DEV_COMPANY_ID/DEV_USER_ID" },
      { status: 401 }
    )
  }

  // 1) Crear OPPORTUNITY (tu schema NO tiene duration_estimated)
  const { data: opp, error: oppErr } = await supabase
    .from("OPPORTUNITY")
    .insert({
      title: String(title).trim(),
      description: String(description).trim(),
      type, // típicamente "TFG"
      mode,
      requirements: String(requirements).trim(),
      contact_info: String(contact_info).trim(),
      status: "ACTIVA", // si tu sistema usa otro valor, ajustalo aquí
      approval_status: "Pendiente",
      lifecycle_status: "Activo",
      company_id: companyId,
    })
    .select()
    .single()

  if (oppErr || !opp) {
    return NextResponse.json(
      { message: "Error al crear la oportunidad", detail: oppErr?.message },
      { status: 500 }
    )
  }

  // 2) Guardar duración en INTERNSHIP.schedule (FK a OPPORTUNITY)
  //    Ojo: INTERNSHIP requiere remuneration y duration (NOT NULL) en tu schema.
  const { error: internshipErr } = await supabase.from("INTERNSHIP").insert({
    opportunity: opp.id,
    schedule: String(duration_estimated).trim(),
    remuneration: 0,
    duration: "0 days",
  })

  if (internshipErr) {
    return NextResponse.json(
      {
        message: "Oportunidad creada, pero falló guardar la duración (INTERNSHIP)",
        detail: internshipErr.message,
      },
      { status: 500 }
    )
  }

  // 3) Auditoría
  await supabase.from("AUDIT_LOG").insert({
    action: "CREATION",
    entity: "OPPORTUNITY",
    entity_id: opp.id,
    company_id: companyId,
    user_id: userId,
    details: { title: opp.title, type: opp.type, duration_estimated: String(duration_estimated).trim() },
  })

  // Devolvemos también duration_estimated para que el front lo vea igual
  return NextResponse.json({ ...opp, duration_estimated: String(duration_estimated).trim() }, { status: 201 })
}

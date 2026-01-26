import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

const PAGE_SIZE = 12
const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth + role (si falla, asumimos "anon" y no aplicamos filtro por rol)
    let userId: string | null = null
    let userRole: string | null = null

    try {
      const { data: authData } = await supabase.auth.getUser()
      userId = authData?.user?.id ?? null

      if (userId) {
        const { data: uRow } = await supabase
          .from("USERS")
          .select("role")
          .eq("id", userId)
          .maybeSingle()

        userRole = uRow?.role ?? null
      }
    } catch {
      userId = null
      userRole = null
    }

    const sp = req.nextUrl.searchParams
    const page = Math.max(1, Number(sp.get("page") ?? "1"))
    const q = (sp.get("q") ?? "").trim()
    const mode = (sp.get("mode") ?? "").trim()
    const companyId = (sp.get("companyId") ?? "").trim()

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from("OPPORTUNITY")
      .select(
        `
        id,
        title,
        type,
        description,
        mode,
        requirements,
        contact_info,
        created_at,
        company_id,
        lifecycle_status,
        approval_status,
        status,
        COMPANY:company_id ( name ),
        flyers ( url, formato ),

        internship:INTERNSHIP!INTERNSHIP_opportunity_fkey ( schedule, duration ),
        tfg:TFG!TFG_opportunity_fkey ( schedule, duration ),
        job:JOB!JOB_opportunity_fkey ( contract_type, salary_min, salary_max, benefits )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to)

    // filtros directos
    if (mode) query = query.eq("mode", mode)
    if (companyId) query = query.eq("company_id", companyId)

    // búsqueda
    if (q) {
      const clean = q.replaceAll('"', "").replaceAll("'", "")
      query = query.or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
    }

    // ✅ REGLAS POR ROL (solo cuando hay rol)
    if (norm(userRole) === "STUDENT") {
      query = query
        .in("type", ["TFG", "INTERNSHIP"])
        .eq("lifecycle_status", "ACTIVE")
        .eq("status", "OPEN")
        .eq("approval_status", "APPROVED")
    }

    if (norm(userRole) === "GRADUATE") {
      query = query
        .in("type", ["JOB"])
        .eq("lifecycle_status", "ACTIVE")
        .eq("status", "OPEN")
        .eq("approval_status", "APPROVED")
    }

    const { data, count, error } = await query
    if (error) throw error

    const rows = data ?? []

    // Auditoría búsqueda (solo si hay usuario)
    // OJO: tu schema dice AUDIT_LOG.details = text, así que guardamos JSON.stringify(...)
    if (userId && (q || mode || companyId)) {
      await supabase.from("AUDIT_LOG").insert({
        action: "search",
        entity: "OPPORTUNITY",
        user_id: userId,
        entity_id: null,
        company_id: companyId || null,
        details: JSON.stringify({
          scope: "CU-012",
          q,
          filters: { mode: mode || null, companyId: companyId || null },
          page,
          userRole,
        }),
      })
    }

    const mapped = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      company: row.COMPANY?.name ?? "Company",
      location: row.mode ?? "",
      type: row.type, // TFG / INTERNSHIP / JOB
      description: row.description ?? "",
      postedAt: row.created_at,
      status: row.status ?? "",
      lifecycle_status: row.lifecycle_status ?? null,
      approval_status: row.approval_status ?? null,
      flyerUrl: row.flyers?.[0]?.url ?? null,

      // Duración estimada (sirve para INTERNSHIP y TFG)
      duration_estimated: row?.internship?.schedule ?? row?.tfg?.schedule ?? "",
      duration_interval: row?.internship?.duration ?? row?.tfg?.duration ?? null,

      // Campos extra de JOB (si querés usarlos en UI)
      contract_type: row?.job?.contract_type ?? null,
      salary_min: row?.job?.salary_min ?? null,
      salary_max: row?.job?.salary_max ?? null,
      benefits: row?.job?.benefits ?? null,
    }))

    const total = count ?? mapped.length
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return NextResponse.json({
      data: mapped,
      page,
      total,
      totalPages,
    })
  } catch (e) {
    console.error("API opportunities error:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

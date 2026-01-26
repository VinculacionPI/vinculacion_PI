import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

const PAGE_SIZE = 12
const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth + role (si falla, asumimos "anon" y NO aplicamos filtro student)
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
        internship:INTERNSHIP!INTERNSHIP_opportunity_fkey ( schedule, duration )
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

    //  REGLA STUDENT: solo TFG + ACTIVE + OPEN
      if (norm(userRole) === "STUDENT") {
        query = query
          .in("type", ["TFG", "INTERNSHIP"])
          .eq("lifecycle_status", "ACTIVE")
          .eq("status", "OPEN")
          .eq("approval_status", "APPROVED")
      }


    const { data, count, error } = await query
    if (error) throw error

    const rows = data ?? []

    // Auditoría búsqueda (solo si hay usuario)
    if (userId && (q || mode || companyId)) {
      await supabase.from("AUDIT_LOG").insert({
        action: "search",
        entity: "OPPORTUNITY",
        user_id: userId,
        entity_id: null,
        company_id: companyId || null,
        details: {
          scope: "CU-012",
          q,
          filters: { mode: mode || null, companyId: companyId || null },
          page,
          userRole,
        },
      })
    }

    const mapped = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      company: row.COMPANY?.name ?? "Company",
      location: row.mode ?? "",
      type: row.type, // ahora sí: TFG / INTERNSHIP / JOB
      description: row.description ?? "",
      postedAt: row.created_at,
      status: row.status ?? "", // OPEN/CLOSED (nunca vacío si DB ya quedó bien)
      lifecycle_status: row.lifecycle_status ?? null,
      approval_status: row.approval_status ?? null,
      flyerUrl: row.flyers?.[0]?.url ?? null,

      // REQ-EE-004: duración estimada (si TFG usa INTERNSHIP.schedule)
      duration_estimated: row?.internship?.schedule ?? "",
      duration_interval: row?.internship?.duration ?? null,
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

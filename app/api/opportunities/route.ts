import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

const PAGE_SIZE = 12

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Sesión (tolerante): si no hay sesión, igual devolvemos oportunidades
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

    // Params
    const sp = req.nextUrl.searchParams
    const page = Math.max(1, Number(sp.get("page") ?? "1"))
    const q = (sp.get("q") ?? "").trim()
    const mode = sp.get("mode")
    const companyId = sp.get("companyId")
    const duration = (sp.get("duration") ?? "").trim()

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Query principal
    let query = supabase
      .from("OPPORTUNITY")
      .select(
        `
        id,
        title,
        description,
        mode,
        created_at,
        company_id,
        lifecycle_status,
        approval_status,
        COMPANY:company_id ( name ),
        flyers ( url, formato ),
        internship:INTERNSHIP!INTERNSHIP_opportunity_fkey ( schedule )
      `,
        { count: "exact" }
      )
      .eq("type", "TFG")
      .eq("lifecycle_status", "Activo")
      // Si querés que el estudiante solo vea aprobadas, descomentá:
      // .eq("approval_status", "Aprobado")
      .order("created_at", { ascending: false })
      .range(from, to)

    // Filtros
    if (mode) query = query.eq("mode", mode)
    if (companyId) query = query.eq("company_id", companyId)

    // Búsqueda
    if (q) {
      const clean = q.replaceAll('"', "").replaceAll("'", "")
      query = query.or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
    }

    const { data, count, error } = await query
    if (error) throw error

    // Filtro duración contra INTERNSHIP.schedule (post-query)
    const filtered =
      duration && duration.length
        ? (data ?? []).filter((row: any) => {
            const sched = row?.internship?.schedule
            if (!sched) return false
            return String(sched).toLowerCase().includes(duration.toLowerCase())
          })
        : data ?? []

    // Auditoría búsqueda (solo si hay usuario)
    if (userId && (q || mode || companyId || duration)) {
      await supabase.from("AUDIT_LOG").insert({
        action: "search",
        entity: "OPPORTUNITY",
        user_id: userId,
        entity_id: null,
        company_id: companyId ?? null,
        details: {
          scope: "CU-012",
          q,
          filters: { mode, companyId, duration },
          page,
          userRole,
        },
      })
    }

    // Map para UI
    const mapped =
      filtered.map((row: any) => ({
        id: row.id,
        title: row.title,
        company: row.COMPANY?.name ?? "Empresa",
        location: row.mode ?? "",
        type: "graduation-project",
        description: row.description ?? "",
        postedAt: row.created_at,
        status: "active",
        flyerUrl: row.flyers?.[0]?.url ?? null,
        lifecycle_status: row.lifecycle_status ?? null,

        // compat con UI (duration input) usando INTERNSHIP.schedule como duración
        duration_estimated: row?.internship?.schedule ?? "",
      })) ?? []

    // Total consistente si duration se filtra post-query
    const total = duration ? mapped.length : (count ?? 0)
    const totalPages = Math.ceil(total / PAGE_SIZE)

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

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

const PAGE_SIZE = 12

//  HARDCODE TEMPORAL (DEV ONLY)
const HARDCODE_USER_ID = "16747327-4a61-42c5-9bc9-22004383a7b4"
const HARDCODE_USER_ROLE = "STUDENT"

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabase()

    //  Usuario hardcodeado
    const user = {
      id: HARDCODE_USER_ID,
      role: HARDCODE_USER_ROLE,
    }

    //  Params
    const sp = req.nextUrl.searchParams
    const page = Math.max(1, Number(sp.get("page") ?? "1"))
    const q = (sp.get("q") ?? "").trim()
    const mode = sp.get("mode")
    const companyId = sp.get("companyId")
    const duration = sp.get("duration")

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    //  Query principal (CU-012: solo TFG activos)
    let query = supabase
      .from("OPPORTUNITY")
      .select(
        `
        id,
        title,
        description,
        mode,
        duration_estimated,
        created_at,
        company_id,
        COMPANY:company_id ( name ),
        flyers ( url, formato )
      `,
        { count: "exact" }
      )
      .eq("type", "TFG")
      .eq("lifecycle_status", "ACTIVE")
      .order("created_at", { ascending: false })
      .range(from, to)

    //  Filtros
    if (mode) query = query.eq("mode", mode)
    if (companyId) query = query.eq("company_id", companyId)
    if (duration) query = query.eq("duration_estimated", duration)

    //  Búsqueda
    if (q) {
      const clean = q.replaceAll('"', "").replaceAll("'", "")
      query = query.or(
        `title.ilike.%${clean}%,description.ilike.%${clean}%`
      )
    }

    const { data, count, error } = await query
    if (error) throw error

    //  Auditoría búsqueda (hardcode user)
    if (q || mode || companyId || duration) {
      await supabase.from("AUDIT_LOG").insert({
        action: "search",
        entity: "OPPORTUNITY",
        user_id: user.id,
        entity_id: null,
        company_id: companyId ?? null,
        details: {
          scope: "CU-012",
          q,
          filters: { mode, companyId, duration },
          page,
        },
      })
    }

    //  Map para UI
    const mapped =
      data?.map((row: any) => ({
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
      })) ?? []

    return NextResponse.json({
      data: mapped,
      page,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    })
  } catch (e) {
    console.error("API opportunities error:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

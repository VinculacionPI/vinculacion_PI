import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

//  En tu sistema ya querés SOLO estos valores:
const LIFECYCLE_ALLOWED = ["ACTIVE", "INACTIVE"] as const
const APPROVAL_ALLOWED = ["PENDING", "APPROVED", "REJECTED"] as const
const TYPE_ALLOWED = ["TFG", "INTERNSHIP", "JOB"] as const
const STATUS_ALLOWED = ["OPEN", "CLOSED"] as const

const normalizeLifecycle = (v?: string | null) => {
  const s = norm(v)
  return (LIFECYCLE_ALLOWED as readonly string[]).includes(s) ? s : null
}

const normalizeApproval = (v?: string | null) => {
  const s = norm(v)
  return (APPROVAL_ALLOWED as readonly string[]).includes(s) ? s : null
}

const normalizeType = (v?: string | null) => {
  const s = norm(v)
  return (TYPE_ALLOWED as readonly string[]).includes(s) ? s : null
}

const normalizeStatus = (v?: string | null) => {
  const s = norm(v)
  return (STATUS_ALLOWED as readonly string[]).includes(s) ? s : null
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const url = new URL(req.url)

    const q = (url.searchParams.get("q") ?? "").trim()

    // filtros (opcionales)
    const lifecycle = (url.searchParams.get("lifecycle") ?? "").trim() // ACTIVE/INACTIVE
    const approval = (url.searchParams.get("approval") ?? "").trim() // PENDING/APPROVED/REJECTED
    const status = (url.searchParams.get("status") ?? "").trim() // OPEN/CLOSED
    const type = (url.searchParams.get("type") ?? "").trim() // TFG/INTERNSHIP/JOB

    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")))

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // 1) usuario real (sesión) + fallback DEV
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr) console.warn("auth.getUser warning:", authErr)

    let userId: string | null = auth?.user?.id ?? null
    if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

    if (!userId) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    /**
     * IMPORTANTE: NO uses !inner aquí.
     * Queremos mostrar el interés aunque la publicación ya no esté visible
     * (ej: se cerró, quedó INACTIVE o REJECTED).
     */
    let query = supabase
      .from("INTEREST")
      .select(
        `
        id,
        created_at,
        opportunity_id,
        OPPORTUNITY:opportunity_id (
          id,
          title,
          type,
          description,
          lifecycle_status,
          approval_status,
          status,
          created_at,
          mode,
          company_id,
          COMPANY:company_id ( id, name ),
          internship:INTERNSHIP!INTERNSHIP_opportunity_fkey ( schedule, remuneration, duration )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to)

    // 2) Filtros (solo si son válidos)
    const lf = normalizeLifecycle(lifecycle)
    if (lf) query = query.eq("OPPORTUNITY.lifecycle_status", lf)

    const ap = normalizeApproval(approval)
    if (ap) query = query.eq("OPPORTUNITY.approval_status", ap)

    const st = normalizeStatus(status)
    if (st) query = query.eq("OPPORTUNITY.status", st)

    const ty = normalizeType(type)
    if (ty) query = query.eq("OPPORTUNITY.type", ty)

    // 3) Search en title/description (embed)
    if (q) {
      const clean = q.replaceAll('"', "").replaceAll("'", "")
      query = query.or(`OPPORTUNITY.title.ilike.%${clean}%,OPPORTUNITY.description.ilike.%${clean}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("ERROR GET MY-INTERESTS", {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      })

      return NextResponse.json(
        {
          error: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        },
        { status: 500 }
      )
    }

    const total = count ?? 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    // 4) Map defensivo + normalización estricta de enums
    const out =
      (data ?? []).map((row: any) => {
        const oppRaw = row?.OPPORTUNITY
        const opp = Array.isArray(oppRaw) ? oppRaw[0] : oppRaw

        const compRaw = opp?.COMPANY
        const company = Array.isArray(compRaw) ? compRaw[0] : compRaw

        const internRaw = opp?.internship
        const internship = Array.isArray(internRaw) ? internRaw[0] : internRaw

        return {
          interestId: row.id,
          interestedAt: row.created_at,

          opportunity: {
            id: opp?.id ?? row.opportunity_id,
            title: opp?.title ?? "",
            type: normalizeType(opp?.type) ?? "TFG",
            lifecycle_status: normalizeLifecycle(opp?.lifecycle_status) ?? null,
            approval_status: normalizeApproval(opp?.approval_status) ?? null,
            status: normalizeStatus(opp?.status) ?? null,
            created_at: opp?.created_at ?? null,
            company: company?.name ?? "No especificada",
            mode: opp?.mode ?? null,

            // extras
            schedule: internship?.schedule ?? "",
            remuneration: internship?.remuneration ?? null,
            internshipDuration: internship?.duration ?? null,
          },
        }
      }) ?? []

    return NextResponse.json({
      data: out,
      page,
      total,
      totalPages,
    })
  } catch (e) {
    console.error("my-interests crash:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

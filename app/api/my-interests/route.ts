import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  const url = new URL(req.url)

  const q = (url.searchParams.get("q") ?? "").trim()
  const status = (url.searchParams.get("status") ?? "").trim()
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")))

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 1) usuario real (sesión) + fallback DEV
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr) {
    console.error("auth.getUser error:", authErr)
  }

  let userId: string | null = auth?.user?.id ?? null
  if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

  if (!userId) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 })
  }

  // 2) Query interests -> opportunity + company + internship
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
        created_at,
        company_id,
        COMPANY:company_id ( id, name ),
        internship:INTERNSHIP!INTERNSHIP_opportunity_fkey ( schedule )
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to)

  // Nota: filtrar por campo del embed a veces es delicado.
  // Si te da error, se hace post-filter.
  if (status) {
    query = query.eq("OPPORTUNITY.lifecycle_status", status)
  }

  if (q) {
    const clean = q.replaceAll('"', "").replaceAll("'", "")
    query = query.or(
      `OPPORTUNITY.title.ilike.%${clean}%,OPPORTUNITY.description.ilike.%${clean}%`
    )
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

  // 3) Map defensivo: OPPORTUNITY/COMPANY/internship pueden venir como objeto o array
  const opportunities =
    (data ?? []).map((row: any) => {
      const oppRaw = row?.OPPORTUNITY
      const opp = Array.isArray(oppRaw) ? oppRaw[0] : oppRaw

      const compRaw = opp?.COMPANY
      const company = Array.isArray(compRaw) ? compRaw[0] : compRaw

      const internRaw = opp?.internship
      const internship = Array.isArray(internRaw) ? internRaw[0] : internRaw

      return {
        id: opp?.id ?? row.opportunity_id,
        title: opp?.title ?? "",
        company: company?.name ?? "No especificada",
        location: opp?.mode ?? "—",
        type: (opp?.type ?? "graduation-project") as
          | "internship"
          | "graduation-project"
          | "job",
        description: opp?.description ?? "",
        postedAt: row.created_at, // fecha de interés
        lifecycle_status: opp?.lifecycle_status ?? null,

        // extra student: duración desde INTERNSHIP.schedule
        schedule: internship?.schedule ?? "",
      }
    }) ?? []

  return NextResponse.json({
    data: opportunities,
    page,
    total,
    totalPages,
  })
}

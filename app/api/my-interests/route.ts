import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

const HARDCODE_STUDENT_ID = "16747327-4a61-42c5-9bc9-22004383a7b4"

export async function GET(req: Request) {
  const supabase = createServerSupabase()
  const url = new URL(req.url)

  const q = (url.searchParams.get("q") ?? "").trim()
  const status = (url.searchParams.get("status") ?? "").trim()
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")))

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

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
        COMPANY:company_id (
          id,
          name
        )
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", HARDCODE_STUDENT_ID)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq("OPPORTUNITY.lifecycle_status", status)
  }

  if (q) {
    query = query.or(`OPPORTUNITY.title.ilike.%${q}%,OPPORTUNITY.description.ilike.%${q}%`)
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

  const opportunities =
    (data ?? []).map((row: any) => {
      const opp = row.OPPORTUNITY
      const company = opp?.COMPANY

      return {
        id: opp?.id,
        title: opp?.title ?? "",
        company: company?.name ?? "No especificada",
        location: "—",
        type: (opp?.type ?? "graduation-project") as "internship" | "graduation-project" | "job",
        description: opp?.description ?? "",
        postedAt: row.created_at, // fecha de interés (más útil para la lista personal)
        lifecycle_status: opp?.lifecycle_status ?? null,
      }
    }) ?? []

  return NextResponse.json({
    data: opportunities,
    page,
    total,
    totalPages,
  })
}

import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

const HARDCODE_STUDENT_ID = "16747327-4a61-42c5-9bc9-22004383a7b4"

export async function POST(req: Request) {
  const supabase = createServerSupabase()

  const body = await req.json().catch(() => null)
  const opportunityIds: string[] = body?.opportunityIds ?? []

  if (!opportunityIds.length) return NextResponse.json({ interestedIds: [] })

  const { data, error } = await supabase
    .from("INTEREST")
    .select("opportunity_id")
    .eq("user_id", HARDCODE_STUDENT_ID)
    .in("opportunity_id", opportunityIds)

  if (error) return NextResponse.json({ interestedIds: [] })

  return NextResponse.json({ interestedIds: (data ?? []).map((r) => r.opportunity_id) })
}

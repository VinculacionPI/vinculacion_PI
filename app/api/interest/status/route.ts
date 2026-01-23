import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

const HARDCODE_STUDENT_ID = "16747327-4a61-42c5-9bc9-22004383a7b4"

export async function GET(req: Request) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const opportunityId = searchParams.get("opportunityId")

  if (!opportunityId) return NextResponse.json({ interested: false })

  const { data } = await supabase
    .from("INTEREST")
    .select("id")
    .eq("user_id", HARDCODE_STUDENT_ID)
    .eq("opportunity_id", opportunityId)
    .maybeSingle()

  return NextResponse.json({ interested: !!data })
}

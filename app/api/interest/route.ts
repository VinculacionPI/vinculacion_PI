import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

// UUID real que existe en auth.users (si querés mantenerlo por ahora)
const HARDCODE_STUDENT_ID = "16747327-4a61-42c5-9bc9-22004383a7b4"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()

  let body: any = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  const opportunityId = body?.opportunityId

  if (!opportunityId) {
    return NextResponse.json({ error: "MISSING_OPPORTUNITY_ID" }, { status: 400 })
  }

  const { error, data } = await supabase
    .from("INTEREST")
    .insert({
      user_id: HARDCODE_STUDENT_ID,
      opportunity_id: opportunityId,
    })
    .select()
    .single()

  if (error) {
    console.error("ERROR INSERT INTEREST", {
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

  return NextResponse.json({ ok: true, data }, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase()

  let body: any = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  const opportunityId = body?.opportunityId

  if (!opportunityId) {
    return NextResponse.json({ error: "MISSING_OPPORTUNITY_ID" }, { status: 400 })
  }

  const { error } = await supabase
    .from("INTEREST")
    .delete()
    .eq("user_id", HARDCODE_STUDENT_ID)
    .eq("opportunity_id", opportunityId)

  if (error) {
    console.error("ERROR DELETE INTEREST", {
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

  return NextResponse.json({ ok: true }, { status: 200 })
}

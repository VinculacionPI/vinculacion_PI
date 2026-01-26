import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function POST(req: NextRequest) {
  const cookie = (await cookies()).get("company_session")
  if (!cookie) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let session
  try {
    session = JSON.parse(cookie.value)
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { opportunity_id, lifecycle_status } = await req.json()

  if (!opportunity_id || !lifecycle_status) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
  }

  const { supabase } = createRouteSupabase(req)

  const { error } = await supabase
    .from("OPPORTUNITY")
    .update({ lifecycle_status })
    .eq("id", opportunity_id)
    .eq("company_id", session.company_id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
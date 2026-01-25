import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get("company_session")

  if (!cookie) return NextResponse.json({ opportunities: [] }, { status: 401 })

  let session
  try {
    session = JSON.parse(cookie.value)
  } catch {
    return NextResponse.json({ opportunities: [] }, { status: 401 })
  }

  const companyId = session.company_id
  if (!companyId) return NextResponse.json({ opportunities: [] }, { status: 401 })

  const { supabase } = createRouteSupabase(req)

  const { data, error } = await supabase.rpc("getcompanyopportunities", {
    p_company_id: companyId,
  })

  if (error) {
    console.error("Error SP getcompanyopportunities:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

    return NextResponse.json({ opportunities: data ?? [] })
}

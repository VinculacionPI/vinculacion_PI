import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get("company_session")

  if (!cookie) {
    return NextResponse.json({ company: null }, { status: 401 })
  }

  let session
  try {
    session = JSON.parse(cookie.value)
  } catch {
    return NextResponse.json({ company: null }, { status: 401 })
  }

  const companyId = session.company_id

  if (!companyId) {
    return NextResponse.json({ company: null }, { status: 401 })
  }

  const { supabase } = createRouteSupabase(req)

  const { data, error } = await supabase.rpc("get_company_by_id", {
    p_company_id: companyId,
  })

  if (error || !data || data.length === 0) {
    return NextResponse.json({ company: null }, { status: 404 })
  }

  return NextResponse.json({
    company: data[0],
  })
}

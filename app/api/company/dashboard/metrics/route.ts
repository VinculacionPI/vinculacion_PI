import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createRouteSupabase } from "@/lib/supabase/route"

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get("company_session")

  if (!cookie) return NextResponse.json({ metrics: null }, { status: 401 })

  let session
  try {
    session = JSON.parse(cookie.value)
  } catch {
    return NextResponse.json({ metrics: null }, { status: 401 })
  }

  const companyId = session.company_id
  if (!companyId) return NextResponse.json({ metrics: null }, { status: 401 })

  const { supabase } = createRouteSupabase(req)

  const { data, error } = await supabase.rpc("metricas_empresa", {
    p_empresa_id: companyId,
  })

  if (error || !data || data.length === 0) {
    return NextResponse.json({ metrics: null }, { status: 500 })
  }

  return NextResponse.json({ metrics: data[0] })
}

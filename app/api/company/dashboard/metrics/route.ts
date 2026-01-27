import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('🔍 Metrics API - User:', user?.email)

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const companyId = user.user_metadata?.company_id

  console.log('✅ Calling RPC with company_id:', companyId)

  const { data, error } = await supabase.rpc('get_dashboard_empresa', {
    p_empresa_id: companyId,
    p_dias: 30
  })

  if (error) {
    console.error('❌ RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ Dashboard data:', data)

  return NextResponse.json({
    success: true,
    data: data,
    metadata: {
      empresa_id: companyId,
      periodo_dias: 30,
      timestamp: new Date().toISOString()
    }
  })
}

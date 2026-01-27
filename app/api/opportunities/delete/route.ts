import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const role = user.user_metadata?.role
  if (role !== 'company' && role !== 'admin') {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { opportunity_id } = body

  if (!opportunity_id) {
    return NextResponse.json({ error: "opportunity_id requerido" }, { status: 400 })
  }

  try {
    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('deleteopportunity', {
      p_opportunity_id: opportunity_id
    })

    if (error) {
      console.error('RPC deleteopportunity error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Oportunidad eliminada'
    })
  } catch (err: any) {
    console.error('Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
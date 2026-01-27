import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await req.json()
  const { flyer_url } = body

  if (!flyer_url) {
    return NextResponse.json({ error: "flyer_url requerido" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('OPPORTUNITY')
      .update({ flyer_url })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando flyer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
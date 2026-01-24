import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("OPPORTUNITY")
      .select("company_id, COMPANY:company_id ( id, name )")
      .eq("type", "TFG")
      .eq("lifecycle_status", "Activo")

    if (error) throw error

    const unique = new Map<string, { id: string; name: string }>()
    for (const row of data ?? []) {
      const c = (row as any).COMPANY
      if (c?.id) unique.set(c.id, { id: c.id, name: c.name })
    }

    return NextResponse.json({ data: Array.from(unique.values()) })
  } catch (e) {
    console.error("companies route error:", e)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}

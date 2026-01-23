import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

const TFG_TYPE = "graduation-project"

export async function GET() {
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .select(
      `
      id,
      title,
      type,
      description,
      created_at,
      approval_status,
      lifecycle_status,
      mode,
      company_id,
      COMPANY:company_id (
        id,
        name
      )
    `
    )
    .eq("approval_status", "PENDING")
    .eq("type", TFG_TYPE)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("ERROR GET PENDING OPPORTUNITIES", {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  // Mapeo al shape que tu tabla espera
  const mapped =
    (data ?? []).map((o: any) => ({
      id: o.id,
      title: o.title,
      company: o.COMPANY?.name ?? "No especificada",
      companyId: o.company_id,
      location: o.mode ?? "—",
      type: o.type,
      status: "pending",
      description: o.description ?? "",
      postedAt: o.created_at, 
      requirements: [], 
      created_at: o.created_at, 
    })) ?? []

  return NextResponse.json(mapped)
}

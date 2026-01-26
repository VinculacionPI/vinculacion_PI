import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerSupabase()

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
      requirements,
      contact_info,
      company_id,
      COMPANY:company_id (
        id,
        name
      )
    `
    )
    .eq("approval_status", "PENDING")
    // opcional, pero lógico: solo activas
    // .eq("lifecycle_status", "ACTIVE")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("ERROR GET PENDING OPPORTUNITIES", {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    })

    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }

  const mapped =
    (data ?? []).map((o: any) => ({
      id: o.id,
      title: o.title,
      type: o.type,
      description: o.description ?? "",
      created_at: o.created_at,
      approval_status: o.approval_status,
      lifecycle_status: o.lifecycle_status,
      mode: o.mode,
      requirements: o.requirements ?? "",
      contact_info: o.contact_info ?? "",
      company_id: o.company_id,
      company_name: o.COMPANY?.name ?? "No especificada",
    }))

  return NextResponse.json(mapped, { status: 200 })
}

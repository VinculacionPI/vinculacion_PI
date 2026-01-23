import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 })

    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from("OPPORTUNITY")
      .select(
        `
        id,
        title,
        description,
        mode,
        duration_estimated,
        requirements,
        contact_info,
        status,
        lifecycle_status,
        created_at,
        company_id,
        COMPANY:company_id ( name ),
        flyers ( url, formato )
      `
      )
      .eq("id", id)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const companyName = data.COMPANY?.[0]?.name ?? "Empresa"
    const flyerUrl = data.flyers?.[0]?.url ?? null

    return NextResponse.json({
      id: data.id,
      title: data.title,
      company: companyName,
      description: data.description ?? "",
      mode: data.mode ?? "",
      duration: data.duration_estimated ?? "",
      requirements: data.requirements ?? "",
      contactInfo: data.contact_info ?? "",
      status: data.status ?? "",
      lifecycleStatus: data.lifecycle_status ?? "",
      createdAt: data.created_at,
      flyerUrl,
    })
  } catch (e) {
    console.error("API opportunities/[id] error:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("OPPORTUNITY")
      .select(
        `
        id,
        title,
        type,
        description,
        mode,
        requirements,
        contact_info,
        status,
        lifecycle_status,
        created_at,
        company_id,
        COMPANY:company_id ( name ),
        flyers ( url, formato ),
        internship:INTERNSHIP!INTERNSHIP_opportunity_fkey (
          schedule,
          remuneration,
          duration
        )
      `
      )
      .eq("id", id)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 })

    // En tu tipado actual, COMPANY y internship salen como arrays
    const companyName =
      Array.isArray((data as any).COMPANY) && (data as any).COMPANY[0]?.name
        ? (data as any).COMPANY[0].name
        : "Empresa"

    const flyerUrl = (data as any).flyers?.[0]?.url ?? null

    const internshipRow =
      Array.isArray((data as any).internship) ? (data as any).internship[0] : (data as any).internship

    return NextResponse.json({
      id: data.id,
      title: data.title,
      type: data.type ?? "",
      company: companyName,
      description: data.description ?? "",
      mode: data.mode ?? "",
      requirements: data.requirements ?? "",
      contactInfo: data.contact_info ?? "",
      status: data.status ?? "",
      lifecycleStatus: data.lifecycle_status ?? "",
      createdAt: data.created_at,
      flyerUrl,

      // Campos “extra” para student (si no hay internship, quedan vacíos)
      schedule: internshipRow?.schedule ?? "",
      remuneration: internshipRow?.remuneration ?? null,
      internshipDuration: internshipRow?.duration ?? null,
    })
  } catch (e) {
    console.error("API opportunities/[id] error:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

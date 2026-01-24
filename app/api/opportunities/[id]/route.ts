import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 })

    const supabase = await createServerSupabase()

    // Role
    let userRole: string | null = null
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id ?? null
      if (userId) {
        const { data: uRow } = await supabase
          .from("USERS")
          .select("role")
          .eq("id", userId)
          .maybeSingle()
        userRole = uRow?.role ?? null
      }
    } catch {
      userRole = null
    }

    let query = supabase
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
        approval_status,
        created_at,
        COMPANY:company_id ( name ),
        flyers ( url, formato ),
        internship:INTERNSHIP!INTERNSHIP_opportunity_fkey ( schedule, duration, remuneration )
      `
      )
      .eq("id", id)

    //  STUDENT: solo TFG ACTIVE OPEN
    if (norm(userRole) === "STUDENT") {
      query = query.eq("type", "TFG").eq("lifecycle_status", "ACTIVE").eq("status", "OPEN")
      // recomendado:
      // query = query.eq("approval_status", "APPROVED")
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const companyObj = Array.isArray((data as any).COMPANY)
      ? (data as any).COMPANY[0]
      : (data as any).COMPANY

    const internshipObj = Array.isArray((data as any).internship)
      ? (data as any).internship[0]
      : (data as any).internship

    const flyerUrl = (data as any).flyers?.[0]?.url ?? null

    return NextResponse.json({
      id: data.id,
      title: data.title ?? "",
      company: companyObj?.name ?? "Empresa",
      description: data.description ?? "",
      mode: data.mode ?? "",

      // DURACIÓN "humana" (schedule)
      duration_estimated: internshipObj?.schedule ?? "",

      // ✅ nuevos: interval + pago
      internship_duration: internshipObj?.duration ?? null,
      remuneration: internshipObj?.remuneration ?? null,

      requirements: data.requirements ?? "",
      contact_info: data.contact_info ?? "",
      status: data.status ?? "",
      lifecycle_status: data.lifecycle_status ?? "",
      approval_status: (data as any).approval_status ?? "",
      created_at: data.created_at,
      flyerUrl,
    })
  } catch (e) {
    console.error("API opportunities/[id] error:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

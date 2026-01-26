import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const oppId = (id ?? "").trim()
    if (!oppId) return NextResponse.json({ message: "Missing id" }, { status: 400 })

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

        internship:INTERNSHIP!INTERNSHIP_opportunity_fkey ( schedule, duration, remuneration ),
        tfg:TFG!TFG_opportunity_fkey ( schedule, duration, remuneration ),
        job:JOB!JOB_opportunity_fkey ( contract_type, salary_min, salary_max, benefits, estimated_start_date )
      `
      )
      .eq("id", oppId)

    //  Reglas por rol (detalle)
    if (norm(userRole) === "STUDENT") {
      query = query
        .in("type", ["TFG", "INTERNSHIP"])
        .eq("lifecycle_status", "ACTIVE")
        .eq("status", "OPEN")
        .eq("approval_status", "APPROVED")
    } else if (norm(userRole) === "GRADUATE") {
      query = query
        .eq("type", "JOB")
        .eq("lifecycle_status", "ACTIVE")
        .eq("status", "OPEN")
        .eq("approval_status", "APPROVED")
    }
    // otros roles: no filtramos aquí (o podrías bloquear si querés)

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const companyObj = Array.isArray((data as any).COMPANY)
      ? (data as any).COMPANY[0]
      : (data as any).COMPANY

    const internshipObj = Array.isArray((data as any).internship)
      ? (data as any).internship[0]
      : (data as any).internship

    const tfgObj = Array.isArray((data as any).tfg)
      ? (data as any).tfg[0]
      : (data as any).tfg

    const jobObj = Array.isArray((data as any).job)
      ? (data as any).job[0]
      : (data as any).job

    const flyerUrl = (data as any).flyers?.[0]?.url ?? null

    // Para student: duración/remuneración pueden venir de internship o tfg
    const duration_estimated = internshipObj?.schedule ?? tfgObj?.schedule ?? ""
    const duration_interval = internshipObj?.duration ?? tfgObj?.duration ?? null
    const remuneration = internshipObj?.remuneration ?? tfgObj?.remuneration ?? null

    return NextResponse.json({
      id: data.id,
      title: data.title ?? "",
      type: (data as any).type ?? null,

      company: companyObj?.name ?? "Empresa",
      description: data.description ?? "",
      mode: data.mode ?? "",

      requirements: data.requirements ?? "",
      contact_info: data.contact_info ?? "",

      status: data.status ?? "",
      lifecycle_status: data.lifecycle_status ?? "",
      approval_status: (data as any).approval_status ?? "",
      created_at: data.created_at,

      flyerUrl,

      //  campos TFG/INTERNSHIP (student)
      duration_estimated,
      internship_duration: duration_interval,
      remuneration,

      //  campos JOB (graduate)
      job: jobObj
        ? {
            contract_type: jobObj.contract_type ?? null,
            salary_min: jobObj.salary_min ?? null,
            salary_max: jobObj.salary_max ?? null,
            benefits: jobObj.benefits ?? null,
            estimated_start_date: jobObj.estimated_start_date ?? null,
          }
        : null,
    })
  } catch (e) {
    console.error("API opportunities/[id] error:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

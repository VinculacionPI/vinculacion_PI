import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    
    const { data: auth } = await supabase.auth.getUser()
    let userId: string | null = auth?.user?.id ?? null
    if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

    if (!userId) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    // 1) Companies: total y pendientes
    const [{ count: totalCompanies, error: errTC }, { count: pendingCompanies, error: errPC }] =
      await Promise.all([
        supabase.from("COMPANY").select("*", { count: "exact", head: true }),
        //  Ajustá el string si tu DB usa "Pendiente" en vez de "PENDING"
        supabase.from("COMPANY").select("*", { count: "exact", head: true }).eq("approval_status", "PENDING"),
      ])

    if (errTC) throw errTC
    if (errPC) throw errPC

    // 2) Opportunities: total, pendientes, activas
    const [
      { count: totalOpportunities, error: errTO },
      { count: pendingOpportunities, error: errPO },
      { count: activeOpportunities, error: errAO },
    ] = await Promise.all([
      supabase.from("OPPORTUNITY").select("*", { count: "exact", head: true }),
      supabase.from("OPPORTUNITY").select("*", { count: "exact", head: true }).eq("approval_status", "PENDING"),
      supabase.from("OPPORTUNITY").select("*", { count: "exact", head: true }).eq("lifecycle_status", "ACTIVE"),
      // Si querés "activas y publicadas", usá esto en vez de la línea de arriba:
      // supabase.from("OPPORTUNITY").select("*", { count: "exact", head: true }).eq("lifecycle_status", "ACTIVE").eq("status", "OPEN"),
    ])

    if (errTO) throw errTO
    if (errPO) throw errPO
    if (errAO) throw errAO

    // 3) Users: total (tu tabla es USERS)
    const { count: totalUsers, error: errTU } = await supabase
      .from("USERS")
      .select("*", { count: "exact", head: true })

    if (errTU) throw errTU

    const stats = {
      totalCompanies: totalCompanies ?? 0,
      pendingCompanies: pendingCompanies ?? 0,
      totalOpportunities: totalOpportunities ?? 0,
      pendingOpportunities: pendingOpportunities ?? 0,
      totalUsers: totalUsers ?? 0,
      activeOpportunities: activeOpportunities ?? 0,
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching admin stats:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    })
    return NextResponse.json(
      { message: "Error interno del servidor", detail: error?.message },
      { status: 500 }
    )
  }
}

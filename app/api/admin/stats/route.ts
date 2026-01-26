import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // auth (solo admins)
    const { data: auth } = await supabase.auth.getUser()
    let userId: string | null = auth?.user?.id ?? null
    if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

    if (!userId) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    /* =========================
       1) COMPANIES
    ========================== */
    const [
      { count: totalCompanies, error: errTC },
      { count: pendingCompanies, error: errPC },
    ] = await Promise.all([
      supabase.from("COMPANY").select("*", { count: "exact", head: true }),
      supabase
        .from("COMPANY")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "PENDING"),
    ])

    if (errTC) throw errTC
    if (errPC) throw errPC

    /* =========================
       2) OPPORTUNITIES
    ========================== */
    const [
      { count: totalOpportunities, error: errTO },
      { count: pendingOpportunities, error: errPO },
      { count: activeOpportunities, error: errAO },
    ] = await Promise.all([
      supabase.from("OPPORTUNITY").select("*", { count: "exact", head: true }),
      supabase
        .from("OPPORTUNITY")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "PENDING"),
      supabase
        .from("OPPORTUNITY")
        .select("*", { count: "exact", head: true })
        .eq("lifecycle_status", "ACTIVE"),
    ])

    if (errTO) throw errTO
    if (errPO) throw errPO
    if (errAO) throw errAO

    /* =========================
       3) USERS
    ========================== */
    const { count: totalUsers, error: errTU } = await supabase
      .from("USERS")
      .select("*", { count: "exact", head: true })

    if (errTU) throw errTU

    /* =========================
       4) GRADUATION REQUESTS 🧑‍🎓🔥
    ========================== */
    const { count: pendingGraduations, error: errPG } = await supabase
      .from("graduation_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (errPG) throw errPG

    /* =========================
       RESULT
    ========================== */
    const stats = {
      totalCompanies: totalCompanies ?? 0,
      pendingCompanies: pendingCompanies ?? 0,

      totalOpportunities: totalOpportunities ?? 0,
      pendingOpportunities: pendingOpportunities ?? 0,
      activeOpportunities: activeOpportunities ?? 0,

      totalUsers: totalUsers ?? 0,

      // 👇 NUEVO
      pendingGraduations: pendingGraduations ?? 0,

      // 👇 opcional: total general de aprobaciones pendientes
      totalPendingApprovals:
        (pendingCompanies ?? 0) +
        (pendingOpportunities ?? 0) +
        (pendingGraduations ?? 0),
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

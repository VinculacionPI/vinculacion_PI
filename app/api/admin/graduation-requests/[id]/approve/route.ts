import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { id } = await ctx.params

  try {
    // auth (con fallback dev)
    const { data: auth } = await supabase.auth.getUser()
    let adminId: string | null = auth?.user?.id ?? null
    if (!adminId && isDev()) adminId = process.env.DEV_USER_ID ?? null

    if (!adminId) {
      return NextResponse.json({ message: "No autenticado y sin DEV_USER_ID" }, { status: 401 })
    }

    // traer request
    const { data: reqRow, error: reqErr } = await supabase
      .from("graduation_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (reqErr || !reqRow) {
      return NextResponse.json(
        { message: "No se encontró la solicitud", detail: reqErr?.message },
        { status: 404 }
      )
    }

    if (String(reqRow.status ?? "").toLowerCase() !== "pending") {
      return NextResponse.json(
        { message: "La solicitud no está pendiente", status: reqRow.status },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()

    // aprobar request (SOLO columnas reales)
    const { data: approvedReq, error: updErr } = await supabase
      .from("graduation_requests")
      .update({
        status: "approved",
        approved_by: adminId,
        approved_at: nowIso,
        admin_notes: null,
        updated_at: nowIso,
      })
      .eq("id", id)
      .select("*")
      .single()

    if (updErr || !approvedReq) {
      return NextResponse.json(
        { message: "Error aprobando solicitud", detail: updErr?.message },
        { status: 500 }
      )
    }

    // actualizar USERS (graduado real)
    const { error: userErr } = await supabase
      .from("USERS")
      .update({
        graduated_at: nowIso,
        graduation_year: approvedReq.graduation_year,
        degree_title: approvedReq.degree_title,
        major: approvedReq.major,
        final_gpa: approvedReq.final_gpa,
        role: "GRADUATE", // ojo: si tu sistema usa "graduate" en minúscula, cambia esto
        updated_at: nowIso,
        role_updated_at: nowIso,
      })
      .eq("id", approvedReq.user_id)

    if (userErr) {
      console.error("ERROR updating USERS on approve graduation:", userErr)
      return NextResponse.json(
        { message: "Aprobado, pero falló actualizar USERS", detail: userErr.message },
        { status: 500 }
      )
    }

    // AUDIT_LOG (details TEXT => stringify)
    const { error: auditErr } = await supabase.from("AUDIT_LOG").insert({
      action: "APPROVE_GRADUATION",
      entity: "GRADUATION_REQUEST",
      entity_id: String(approvedReq.id),
      user_id: String(adminId),
      details: JSON.stringify({
        request_id: approvedReq.id,
        student_id: approvedReq.user_id,
        graduation_year: approvedReq.graduation_year,
        degree_title: approvedReq.degree_title,
      }),
    })

    if (auditErr) {
      console.error("ERROR inserting AUDIT_LOG:", auditErr)
      // no matamos el flujo si auditar falla
    }

    return NextResponse.json(
      { message: "Graduación aprobada", graduation_request: approvedReq },
      { status: 200 }
    )
  } catch (e: any) {
    console.error("FATAL ERROR approve graduation:", e)
    return NextResponse.json(
      { message: "Error interno", detail: String(e?.message ?? e) },
      { status: 500 }
    )
  }
}

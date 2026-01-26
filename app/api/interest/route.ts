console.log("INTEREST ROUTE VERSION: 2026-01-25-1")

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

function isActiveLifecycle(v: unknown) {
  return norm(String(v ?? "")) === "ACTIVE"
}

function isOpenStatus(v: unknown) {
  return norm(String(v ?? "")) === "OPEN"
}

// Si en tu DB hay valores inconsistentes (ej: PASANTIA), los incluimos para no bloquear.
const STUDENT_ALLOWED_TYPES = new Set(["TFG", "INTERNSHIP", "PASANTIA"])

// AUDIT_LOG real: (id, created_at, action, entity, entity_id text, details text)
async function auditBestEffort(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  payload: {
    action: string
    entity: string
    entity_id?: string | null
    details?: any
  }
) {
  try {
    await supabase.from("AUDIT_LOG").insert({
      action: payload.action,
      entity: payload.entity,
      entity_id: String(payload.entity_id ?? ""),
      details: payload.details != null ? JSON.stringify(payload.details) : "",
    })
  } catch (e) {
    console.warn("AUDIT_LOG insert failed (ignored):", e)
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }
  const userId = auth.user.id

  const body = await req.json().catch(() => null) as any
  const opportunityId = String(body?.opportunityId ?? "").trim()
  if (!opportunityId) {
    return NextResponse.json({ error: "MISSING_OPPORTUNITY_ID" }, { status: 400 })
  }

  const { data: uRow, error: uErr } = await supabase
    .from("USERS")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (uErr) {
    return NextResponse.json({ error: "USER_LOOKUP_FAILED" }, { status: 500 })
  }

  const userRole = uRow?.role ?? null

  const { data: opp, error: oppErr } = await supabase
    .from("OPPORTUNITY")
    .select("id,type,lifecycle_status,status,company_id,title,approval_status")
    .eq("id", opportunityId)
    .maybeSingle()

  if (oppErr) return NextResponse.json({ error: "OPPORTUNITY_LOOKUP_FAILED" }, { status: 500 })
  if (!opp) return NextResponse.json({ error: "OPPORTUNITY_NOT_FOUND" }, { status: 404 })

  // Regla de disponibilidad para interactuar
  if (!isActiveLifecycle(opp.lifecycle_status) || !isOpenStatus(opp.status)) {
    return NextResponse.json({ error: "INACTIVE_OR_CLOSED" }, { status: 409 })
  }

  // Si quieres mantener "solo aprobadas" para interés, descomenta esto:
  // if (norm(opp.approval_status) !== "APPROVED") {
  //   return NextResponse.json({ error: "NOT_APPROVED" }, { status: 409 })
  // }

  // Permisos por rol
  if (norm(userRole) === "STUDENT") {
    const t = norm(opp.type)
    if (!STUDENT_ALLOWED_TYPES.has(t)) {
      return NextResponse.json({ error: "NOT_ALLOWED" }, { status: 403 })
    }
  }

  // Insert con service role (evita RLS en INTEREST y triggers)
  const { error, data } = await supabaseAdmin
    .from("INTEREST")
    .insert({ user_id: userId, opportunity_id: opportunityId })
    .select()
    .single()

  if (error) {
    const code = (error as any).code
    if (code === "23505") {
      return NextResponse.json({ error: "DUPLICATE" }, { status: 409 })
    }

    console.error("ERROR INSERT INTEREST", {
      message: error.message,
      code,
      details: (error as any).details,
    })
    return NextResponse.json({ error: "INSERT_FAILED", detail: error.message }, { status: 500 })
  }

  // Auditoría compatible con tu AUDIT_LOG real
  await auditBestEffort(supabase, {
    action: "interest_create",
    entity: "OPPORTUNITY",
    entity_id: opportunityId,
    details: {
      scope: "INTEREST",
      opportunityId,
      title: opp.title ?? null,
      company_id: opp.company_id ?? null,
      opportunity_type: opp.type ?? null,
      role: userRole,
      userId,
    },
  })

  return NextResponse.json({ ok: true, data }, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }
  const userId = auth.user.id

  const body = await req.json().catch(() => null) as any
  const opportunityId = String(body?.opportunityId ?? "").trim()
  if (!opportunityId) {
    return NextResponse.json({ error: "MISSING_OPPORTUNITY_ID" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("INTEREST")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)

  if (error) {
    console.error("ERROR DELETE INTEREST", { message: error.message, code: (error as any).code })
    return NextResponse.json({ error: "DELETE_FAILED", detail: error.message }, { status: 500 })
  }

  await auditBestEffort(supabase, {
    action: "interest_delete",
    entity: "OPPORTUNITY",
    entity_id: opportunityId,
    details: {
      scope: "INTEREST",
      opportunityId,
      userId,
    },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}

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

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }
  const userId = auth.user.id

  const body = await req.json().catch(() => ({}))
  const opportunityId = String(body?.opportunityId ?? "").trim()
  if (!opportunityId) {
    return NextResponse.json({ error: "MISSING_OPPORTUNITY_ID" }, { status: 400 })
  }

  const { data: uRow } = await supabase.from("USERS").select("role").eq("id", userId).maybeSingle()
  const userRole = uRow?.role ?? null

  const { data: opp, error: oppErr } = await supabase
    .from("OPPORTUNITY")
    .select("id,type,lifecycle_status,status,company_id,title")
    .eq("id", opportunityId)
    .maybeSingle()

  if (oppErr) return NextResponse.json({ error: "OPPORTUNITY_LOOKUP_FAILED" }, { status: 500 })
  if (!opp) return NextResponse.json({ error: "OPPORTUNITY_NOT_FOUND" }, { status: 404 })

  if (!isActiveLifecycle(opp.lifecycle_status) || !isOpenStatus(opp.status)) {
    return NextResponse.json({ error: "INACTIVE_OR_CLOSED" }, { status: 409 })
  }

  if (norm(userRole) === "STUDENT" && norm(opp.type) !== "TFG") {
    return NextResponse.json({ error: "NOT_ALLOWED" }, { status: 403 })
  }

  //  INSERT con SERVICE ROLE (evita que un trigger a NOTIFICATION reviente por RLS)
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

  // AUDIT_LOG (best-effort)
  try {
    await supabase.from("AUDIT_LOG").insert({
      action: "interest_create",
      entity: "OPPORTUNITY",
      user_id: userId,
      entity_id: opportunityId,
      company_id: opp.company_id ?? null,
      opportunity_id: opportunityId,
      details: {
        scope: "INTEREST",
        opportunityId,
        title: opp.title ?? null,
        role: userRole,
      },
    })
  } catch (e) {
    console.warn("AUDIT_LOG insert failed (ignored):", e)
  }

  return NextResponse.json({ ok: true, data }, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }
  const userId = auth.user.id

  const body = await req.json().catch(() => ({}))
  const opportunityId = String(body?.opportunityId ?? "").trim()
  if (!opportunityId) {
    return NextResponse.json({ error: "MISSING_OPPORTUNITY_ID" }, { status: 400 })
  }

  //  DELETE con SERVICE ROLE también (por si hay trigger)
  const { error } = await supabaseAdmin
    .from("INTEREST")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)

  if (error) {
    console.error("ERROR DELETE INTEREST", { message: error.message, code: (error as any).code })
    return NextResponse.json({ error: "DELETE_FAILED", detail: error.message }, { status: 500 })
  }

  try {
    await supabase.from("AUDIT_LOG").insert({
      action: "interest_delete",
      entity: "OPPORTUNITY",
      user_id: userId,
      entity_id: opportunityId,
      opportunity_id: opportunityId,
      details: { scope: "INTEREST", opportunityId },
    })
  } catch (e) {
    console.warn("AUDIT_LOG delete audit failed (ignored):", e)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

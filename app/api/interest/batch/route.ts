import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, res } = createRouteSupabase(req)

    const body = await req.json().catch(() => null)
    const opportunityIds: string[] = body?.opportunityIds ?? []

    if (!Array.isArray(opportunityIds) || opportunityIds.length === 0) {
      const out = NextResponse.json({ interestedIds: [] }, { status: 200 })
      const setCookie = res.headers.get("set-cookie")
      if (setCookie) out.headers.set("set-cookie", setCookie)
      return out
    }

    // 1) user real o fallback DEV
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr) console.warn("auth.getUser warning:", authErr)

    let userId: string | null = auth?.user?.id ?? null
    if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

    if (!userId) {
      const out = NextResponse.json({ message: "No autenticado" }, { status: 401 })
      const setCookie = res.headers.get("set-cookie")
      if (setCookie) out.headers.set("set-cookie", setCookie)
      return out
    }

    // 2) query interests
    const { data, error } = await supabase
      .from("INTEREST")
      .select("opportunity_id")
      .eq("user_id", userId)
      .in("opportunity_id", opportunityIds)

    if (error) {
      console.error("interest/batch error:", error)
      const out = NextResponse.json({ interestedIds: [] }, { status: 200 })
      const setCookie = res.headers.get("set-cookie")
      if (setCookie) out.headers.set("set-cookie", setCookie)
      return out
    }

    const out = NextResponse.json(
      { interestedIds: (data ?? []).map((r: any) => r.opportunity_id) },
      { status: 200 }
    )

    // Pasar Set-Cookie si Supabase actualizó tokens
    const setCookie = res.headers.get("set-cookie")
    if (setCookie) out.headers.set("set-cookie", setCookie)

    return out
  } catch (e) {
    console.error("interest/batch crash:", e)
    return NextResponse.json({ interestedIds: [] }, { status: 200 })
  }
}

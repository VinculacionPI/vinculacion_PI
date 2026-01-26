import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

function copySetCookies(from: Headers, to: Headers) {
  const anyFrom = from as any
  if (typeof anyFrom.getSetCookie === "function") {
    const cookies: string[] = anyFrom.getSetCookie()
    for (const c of cookies) to.append("set-cookie", c)
    return
  }
  const single = from.get("set-cookie")
  if (single) to.set("set-cookie", single)
}

export async function POST(req: NextRequest) {
  const { supabase, res } = createRouteSupabase(req)

  const respond = (json: any, init?: ResponseInit) => {
    const out = NextResponse.json(json, init)
    copySetCookies(res.headers, out.headers)
    return out
  }

  try {
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      return respond({ error: "UNAUTHORIZED" }, { status: 401 })
    }
    const userId = auth.user.id

    const body = await req.json().catch(() => null) as any
    const opportunityIds: string[] = body?.opportunityIds ?? []

    if (!Array.isArray(opportunityIds)) {
      return respond({ error: "BAD_REQUEST" }, { status: 400 })
    }

    if (opportunityIds.length === 0) {
      return respond({ interestedIds: [] }, { status: 200 })
    }

    const { data, error } = await supabase
      .from("INTEREST")
      .select("opportunity_id")
      .eq("user_id", userId)
      .in("opportunity_id", opportunityIds)

    if (error) {
      console.error("interest/batch error:", error)
      return respond({ error: "QUERY_FAILED" }, { status: 500 })
    }

    return respond(
      { interestedIds: (data ?? []).map((r: any) => r.opportunity_id) },
      { status: 200 }
    )
  } catch (e) {
    console.error("interest/batch crash:", e)
    return respond({ error: "INTERNAL" }, { status: 500 })
  }
}

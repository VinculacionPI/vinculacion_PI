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

export async function GET(req: NextRequest) {
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

    const opportunityId = String(req.nextUrl.searchParams.get("opportunityId") ?? "").trim()
    if (!opportunityId) return respond({ error: "MISSING_OPPORTUNITY_ID" }, { status: 400 })

    const { data, error } = await supabase
      .from("INTEREST")
      .select("id")
      .eq("user_id", userId)
      .eq("opportunity_id", opportunityId)
      .maybeSingle()

    if (error) {
      console.error("interest/status error:", error)
      return respond({ error: "QUERY_FAILED" }, { status: 500 })
    }

    return respond({ interested: !!data }, { status: 200 })
  } catch (e) {
    console.error("interest/status crash:", e)
    return respond({ error: "INTERNAL" }, { status: 500 })
  }
}

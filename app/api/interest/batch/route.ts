import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabase } from "@/lib/supabase/route"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

/**
 * Copia TODOS los Set-Cookie que haya generado Supabase (refresh de sesión, etc.)
 * Next a veces devuelve múltiples cookies, y .get("set-cookie") solo trae una.
 */
function copySetCookies(from: Headers, to: Headers) {
  // Next/Undici soporta getSetCookie() en muchos entornos
  const anyFrom = from as any

  if (typeof anyFrom.getSetCookie === "function") {
    const cookies: string[] = anyFrom.getSetCookie()
    for (const c of cookies) to.append("set-cookie", c)
    return
  }

  // Fallback: si solo existe get("set-cookie")
  const single = from.get("set-cookie")
  if (single) to.set("set-cookie", single)
}

export async function POST(req: NextRequest) {
  const { supabase, res } = createRouteSupabase(req)

  try {
    const body = await req.json().catch(() => null)
    const opportunityIds: string[] = body?.opportunityIds ?? []

    // Respuesta helper que siempre copia cookies
    const respond = (json: any, init?: ResponseInit) => {
      const out = NextResponse.json(json, init)
      copySetCookies(res.headers, out.headers)
      return out
    }

    if (!Array.isArray(opportunityIds) || opportunityIds.length === 0) {
      return respond({ interestedIds: [] }, { status: 200 })
    }

    // 1) user real o fallback DEV
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr) console.warn("auth.getUser warning:", authErr)

    let userId: string | null = auth?.user?.id ?? null
    if (!userId && isDev()) userId = process.env.DEV_USER_ID ?? null

    if (!userId) {
      return respond({ message: "No autenticado" }, { status: 401 })
    }

    // 2) query interests
    const { data, error } = await supabase
      .from("INTEREST")
      .select("opportunity_id")
      .eq("user_id", userId)
      .in("opportunity_id", opportunityIds)

    if (error) {
      console.error("interest/batch error:", error)
      // no rompas la UI, solo devolvé vacío
      return respond({ interestedIds: [] }, { status: 200 })
    }

    return respond(
      { interestedIds: (data ?? []).map((r: any) => r.opportunity_id) },
      { status: 200 }
    )
  } catch (e) {
    console.error("interest/batch crash:", e)
    // no rompas la UI
    const out = NextResponse.json({ interestedIds: [] }, { status: 200 })
    copySetCookies(res.headers, out.headers)
    return out
  }
}

import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const url = new URL(request.url)
    const opportunityId = url.pathname.split("/").at(-2)

    if (!opportunityId) {
      return NextResponse.json(
        { error: "MISSING_OPPORTUNITY_ID" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("APPLY_OPPORTUNITY")
      .select(`
        id,
        created_at,
        cv_url,
        user:USERS (
          id,
          name,
          email,
          major,
          semester,
          graduation_year,
          degree_title,
          role
        )
      `)
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("DB error:", error)
      return NextResponse.json(
        { error: "ERROR_FETCHING_APPLICATIONS" },
        { status: 500 }
      )
    }

    const applications = (data ?? []).map((app: { created_at: { toISOString: () => any } }) => ({
      ...app,
      created_at: app.created_at instanceof Date
        ? app.created_at.toISOString()
        : app.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: { applications },
    })
  } catch (e) {
    console.error("Server error:", e)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

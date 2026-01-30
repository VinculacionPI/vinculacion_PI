import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {

  const supabase = await createServerSupabase()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { id: applicationId } = await context.params

  if (!applicationId) {
    return NextResponse.json({ error: "MISSING_APPLICATION_ID" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("APPLY_OPPORTUNITY")
    .select("cv_url")
    .eq("id", applicationId)
    .single()

  if (error || !data?.cv_url) {
    return NextResponse.json({ error: "CV_NOT_FOUND" }, { status: 404 })
  }

  const { data: publicUrl } = supabase.storage
    .from("cv")
    .getPublicUrl(data.cv_url)

  if (!publicUrl?.publicUrl) {
    return NextResponse.json({ error: "CV_URL_NOT_FOUND" }, { status: 404 })
  }

  return NextResponse.redirect(publicUrl.publicUrl)
}

import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from("graduation_requests")
    .select(
      `
      id,
      user_id,
      graduation_year,
      degree_title,
      major,
      thesis_title,
      final_gpa,
      status,
      admin_notes,
      requested_at,
      approved_at,
      USERS:user_id (
        email,
        name
      )
    `
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: true })

  if (error) {
    console.error("ERROR GET graduation_requests pending", {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const mapped = (data ?? []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    graduation_year: r.graduation_year,
    degree_title: r.degree_title,
    major: r.major,
    thesis_title: r.thesis_title,
    final_gpa: r.final_gpa,
    status: r.status,
    admin_notes: r.admin_notes,
    requested_at: r.requested_at,
    approved_at: r.approved_at,
    user_email: r.USERS?.email ?? null,
    user_name: r.USERS?.name ?? null,
  }))

  return NextResponse.json(mapped)
}

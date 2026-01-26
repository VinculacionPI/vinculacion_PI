import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerSupabase()

  try {
    const { data: companies, error } = await supabase
      .from("COMPANY")
      .select("*")
      .eq("approval_status", "Pendiente")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json(
        { message: "Error al obtener empresas pendientes", detail: error.message },
        { status: 500 }
      )
    }

    console.log("[v0] Pending companies fetched:", companies)

    return NextResponse.json(Array.isArray(companies) ? companies : [])
  } catch (err) {
    console.error("[v0] Unexpected error:", err)
    return NextResponse.json({ message: "Error interno del servidor", detail: String(err) }, { status: 500 })
  }
}

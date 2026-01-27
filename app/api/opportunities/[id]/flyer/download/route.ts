// app/api/opportunities/[id]/flyer/download/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

function guessExtFromUrl(url: string): string {
  const u = url.toLowerCase().split("?")[0].split("#")[0]
  if (u.endsWith(".pdf")) return "pdf"
  if (u.endsWith(".png")) return "png"
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "jpg"
  if (u.endsWith(".html") || u.endsWith(".htm")) return "html"
  return "bin"
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const oppId = (id ?? "").trim()
    if (!oppId) return NextResponse.json({ message: "Missing id" }, { status: 400 })

    const supabase = await createServerSupabase()

    // ✅ obligar login (opcional, pero recomendado)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    // ✅ leer flyer_url desde OPPORTUNITY
    const { data: opp, error } = await supabase
      .from("OPPORTUNITY")
      .select("id, flyer_url, title")
      .eq("id", oppId)
      .maybeSingle()

    if (error) throw error

    const flyerUrl = (opp?.flyer_url ?? "").trim()
    if (!flyerUrl) {
      return NextResponse.json({ message: "Flyer no encontrado" }, { status: 404 })
    }

    // ✅ caso 1: data:text/html;base64,...
    if (flyerUrl.startsWith("data:text/html;base64,")) {
      const base64 = flyerUrl.split(",")[1] ?? ""
      const html = Buffer.from(base64, "base64").toString("utf-8")

      const filename = `flyer-${oppId}.html`
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      })
    }

    // ✅ caso 2: cualquier http(s) (supabase public o externo) -> redirect
    if (flyerUrl.startsWith("http://") || flyerUrl.startsWith("https://")) {
      return NextResponse.redirect(flyerUrl, { status: 302 })
    }

    // ✅ fallback raro
    const ext = guessExtFromUrl(flyerUrl)
    return NextResponse.json(
      { message: `Formato de flyer_url no soportado`, flyer_url: flyerUrl, ext },
      { status: 400 }
    )
  } catch (e) {
    console.error("download flyer error:", e)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

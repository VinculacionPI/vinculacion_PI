import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("cv") as File | null
    const opportunityId = formData.get("opportunityId") as string | null

    if (!file || !opportunityId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo supera los 5MB" },
        { status: 400 }
      )
    }

    const filePath = `${user.id}/${opportunityId}.pdf`

    const { error: uploadError } = await supabase.storage
      .from("cv")
      .upload(filePath, file, {
        upsert: true,
        contentType: "application/pdf",
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    const { data: applyId, error: spError } = await supabase.rpc(
      "apply_to_opportunity",
      {
        p_user_id: user.id,
        p_opportunity_id: opportunityId,
        p_cv_url: filePath,
      }
    )

    if (spError) {
      if (spError.message === "YA_APLICO") {
        return NextResponse.json(
          { error: "Ya postulaste a esta oportunidad" },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: spError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      apply_id: applyId,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    )
  }
}

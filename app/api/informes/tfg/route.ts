// app/api/informes/tfg/route.ts
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

type Body = {
  empresa_id?: string
  tipo?: string // UI: "TFG" | "PASANTIA" | "EMPLEO" (o directo "INTERNSHIP"/"JOB")
}

type Row = {
  id: string
  title: string
  created_at: string
  status?: string | null
  lifecycle_status?: string | null
  approval_status?: string | null
  mode?: string | null
  type?: string | null
  company_id?: string | null
  COMPANY?: { name: string | null } | null
}

// ===== Normalizadores según tu DB real =====

const mapTipoToDbType = (tipo?: string) => {
  if (!tipo) return undefined
  const t = tipo.trim().toUpperCase()
  // Tu DB usa: TFG / INTERNSHIP / JOB
  const map: Record<string, string> = {
    TFG: "TFG",
    PASANTIA: "INTERNSHIP",
    EMPLEO: "JOB",
    INTERNSHIP: "INTERNSHIP",
    JOB: "JOB",
  }
  return map[t] ?? t
}

const normalizeStatus = (status?: string | null, lifecycle?: string | null) => {
  const s = (status ?? "").trim().toUpperCase()
  const l = (lifecycle ?? "").trim().toUpperCase()

  // En tu data hay: status = OPEN/CLOSED/ACTIVE
  // y lifecycle_status = ACTIVE/INACTIVE/ON_HOLD
  // Preferimos status si viene OPEN/CLOSED, si viene ACTIVE lo dejamos ACTIVE.
  if (s) return s

  // Si no hay status, derivamos de lifecycle
  if (l === "ACTIVE") return "OPEN"
  if (l === "INACTIVE") return "CLOSED"
  if (l === "ON_HOLD") return "ON_HOLD"
  return "OPEN"
}

const normalizeApproval = (v?: string | null) => {
  const raw = (v ?? "").trim()
  const up = raw.toUpperCase()
  // 👇 tu dato sucio: "Aprobado"
  if (up === "APROBADO") return "APPROVED"
  return up || "PENDING"
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const body = (await req.json().catch(() => ({}))) as Body

    // ✅ Ajusta la relación si no se llama COMPANY en tu schema.
    // Algunas variantes: company:COMPANY(name) o COMPANY!inner(name)
    let query = supabase
      .from("OPPORTUNITY")
      .select(
        `
        id,
        title,
        created_at,
        status,
        lifecycle_status,
        approval_status,
        mode,
        type,
        company_id,
        COMPANY(name)
      `
      ) as any

    // Filtro empresa
    if (body.empresa_id) {
      query = query.eq("company_id", body.empresa_id)
    }

    // Filtro tipo (mapeado a tu DB real: TFG/INTERNSHIP/JOB)
    const mappedType = mapTipoToDbType(body.tipo)
    if (mappedType) {
      query = query.eq("type", mappedType)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    const rows = (data ?? []) as Row[]

    const tfgs = rows.map((r) => {
      const st = normalizeStatus(r.status, r.lifecycle_status)
      const ap = normalizeApproval(r.approval_status)

      return {
        id: r.id,
        title: r.title,
        company_name: r.COMPANY?.name ?? "Sin empresa",
        status: st, // OPEN / CLOSED / ACTIVE / etc
        approval_status: ap, // APPROVED/PENDING/REJECTED (normalizado)
        created_at: r.created_at,
        mode: r.mode ?? "",
        type: (r.type ?? "").trim().toUpperCase(), // TFG/INTERNSHIP/JOB
      }
    })

    // Estadísticas (usando tus valores reales)
    const estadisticas = {
      total_tfgs: tfgs.length,
      // Consideramos "activos" lo que esté OPEN o ACTIVE
      activos: tfgs.filter((x) => x.status === "OPEN" || x.status === "ACTIVE").length,
      cerrados: tfgs.filter((x) => x.status === "CLOSED").length,
      pendientes_aprobacion: tfgs.filter((x) => x.approval_status === "PENDING").length,
      aprobados: tfgs.filter((x) => x.approval_status === "APPROVED").length,
      rechazados: tfgs.filter((x) => x.approval_status === "REJECTED").length,
    }

    // Tu page.tsx espera response.data.contenido como string JSON
    const contenido = JSON.stringify(
      {
        estadisticas,
        tfgs,
      },
      null,
      2
    )

    return NextResponse.json({
      success: true,
      data: { contenido },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Error interno generando informe" },
      { status: 500 }
    )
  }
}

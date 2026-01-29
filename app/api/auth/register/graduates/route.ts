import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabase } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// ===== Zod schema =====
// NOTA: graduation_requests.status es en minúsculas: pending/approved/rejected
// USERS.status vos lo querés en mayúsculas: PENDING/APPROVED/REJECTED
const graduateSchema = z.object({
  user_id: z.string().uuid(),

  name: z.string().min(3).max(100),
  email: z.string().email(),
  personalEmail: z.string().email().optional().nullable(),

  cedula: z.string().regex(/^\d{9}$/, "La cédula debe tener 9 dígitos numéricos"),
  carnet: z.string().regex(/^\d{7,10}$/, "El carnet debe tener entre 7 y 10 dígitos"),
  phone: z.string().regex(/^\d{8}$/, "El teléfono debe tener 8 dígitos"),
  address: z.string().min(5).max(500),

  graduation_year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  degree_title: z.string().min(2).max(150),
  major: z.string().max(150).optional().nullable(),
  thesis_title: z.string().max(200).optional().nullable(),
  final_gpa: z.number().min(0).max(10).optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    console.log(" API Route: /api/auth/register/graduates recibiendo solicitud...")

    const body = await request.json()
    console.log(" Datos recibidos:", JSON.stringify(body, null, 2))

    const validated = graduateSchema.parse({
      ...body,
      graduation_year: Number(body.graduation_year),
      final_gpa: body.final_gpa === null || body.final_gpa === undefined || body.final_gpa === ""
        ? null
        : Number(body.final_gpa),
    })

    const supabase = await createServerSupabase()

    // ===== 1) Verificar unicidad en USERS (email/cedula/carnet) =====
    console.log(" Verificando unicidad de datos...")

    const emailLower = validated.email.toLowerCase()

    const { data: existingUsers, error: checkError } = await supabase
      .from("USERS")
      .select("id, email, cedula, carnet, role, status")
      .or(`email.eq.${emailLower},cedula.eq.${validated.cedula},carnet.eq.${validated.carnet}`)

    if (checkError) {
      console.error(" Error verificando datos:", checkError)
      throw new Error(`Error verificando datos: ${checkError.message}`)
    }

    // Si existe alguien con esos datos, bloqueamos (como student) PERO:
    // si ese existing es el mismo user_id (reintento), se permite (con regla 30 días si rechazado)
    const duplicate = (existingUsers || []).find((u) => u.id !== validated.user_id)

    if (duplicate) {
      if (duplicate.email === emailLower) throw new Error("Este correo ya está registrado")
      if (duplicate.cedula === validated.cedula) throw new Error("Esta cédula ya está registrada")
      if (duplicate.carnet === validated.carnet) throw new Error("Este carnet ya está registrado")
      throw new Error("Datos duplicados detectados")
    }

    // ===== 2) Regla reintento tras 30 días si fue rechazado =====
    // Buscamos última solicitud rejected del mismo user_id
    const { data: lastRejected, error: rejErr } = await supabase
      .from("graduation_requests")
      .select("status, requested_at")
      .eq("user_id", validated.user_id)
      .eq("status", "rejected")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rejErr) {
      console.warn(" No se pudo consultar lastRejected (no crítico):", rejErr)
    }

    if (lastRejected?.requested_at) {
      const requestedAt = new Date(lastRejected.requested_at)
      const reapplyAfter = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

      if (new Date() < reapplyAfter) {
        const yyyyMmDd = reapplyAfter.toISOString().slice(0, 10)
        return NextResponse.json(
          {
            success: false,
            message: `Fuiste rechazado previamente. Podés reintentar después de ${yyyyMmDd}.`,
          },
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // ===== 3) Insert/Upsert en USERS =====
    // Usamos status PENDING y role graduate (como vos pediste)
    const userData = {
      id: validated.user_id,
      email: emailLower,
      role: "graduate",
      status: "PENDING",

      name: validated.name.trim(),
      cedula: validated.cedula,
      carnet: validated.carnet,
      phone: validated.phone,
      personalEmail: validated.personalEmail?.toLowerCase() || null,
      address: validated.address.trim(),

      updated_at: new Date().toISOString(),
      role_updated_at: new Date().toISOString(),
    }

    console.log(" Upsert USERS:", JSON.stringify(userData, null, 2))

    // Upsert por si el user ya existía (reintento) o se creó partial antes
    const { data: upsertedUser, error: upsertErr } = await supabase
      .from("USERS")
      .upsert([userData] as any, { onConflict: "id" })
      .select()
      .single()

    if (upsertErr) {
      console.error(" Error upsert USERS:", upsertErr)
      throw new Error(`Error al crear/actualizar perfil: ${upsertErr.message}`)
    }

    // ===== 4) Crear solicitud en graduation_requests =====
    // status en minúscula por el CHECK de tu tabla
    const requestData = {
      user_id: validated.user_id,
      graduation_year: validated.graduation_year,
      degree_title: validated.degree_title.trim(),
      major: validated.major?.trim() || null,
      thesis_title: validated.thesis_title?.trim() || null,
      final_gpa: validated.final_gpa ?? null,
      status: "pending",
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log(" Insert graduation_requests:", JSON.stringify(requestData, null, 2))

    const { data: insertedReq, error: reqErr } = await supabase
      .from("graduation_requests")
      .insert([requestData] as any)
      .select()
      .single()

    if (reqErr) {
      console.error(" Error insert graduation_requests:", reqErr)
      throw new Error(`Error creando solicitud de graduación: ${reqErr.message}`)
    }

    // ===== 5) Actualizar metadata en auth.users (admin) =====
    // Esto sí debería usar supabaseAdmin
    try {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(validated.user_id, {
        user_metadata: {
          name: validated.name,
          role: "graduate",
          cedula: validated.cedula,
          carnet: validated.carnet,
          graduation_year: validated.graduation_year,
          degree_title: validated.degree_title,
        },
      })

      if (updateAuthError) {
        console.warn(" Error actualizando metadata de auth (no crítico):", updateAuthError)
      } else {
        console.log(" Metadata de auth actualizada (graduate)")
      }
    } catch (authError) {
      console.warn(" Error en actualización auth (no crítico):", authError)
    }

    // Auditoría opcional (si querés)
    try {
      await supabase.from("audit_logs").insert([
        {
          user_id: validated.user_id,
          operation_type: "registration",
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          details: `Registro de graduado (PENDING): ${validated.name} (${validated.carnet})`,
          metadata: {
            email: validated.email,
            cedula: validated.cedula,
            carnet: validated.carnet,
            graduation_year: validated.graduation_year,
            degree_title: validated.degree_title,
            source: "graduate_register_form",
          },
          created_at: new Date().toISOString(),
        },
      ] as any)
    } catch (auditError) {
      console.warn(" Error en auditoría (no crítico):", auditError)
    }

    // ===== 6) Notificar a administradores =====
    try {
      const { data: admins } = await supabase
        .from('USERS')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'PENDING_GRADUATION',
          title: 'Nueva solicitud de egresado',
          message: `${validated.name} (${validated.carnet}) solicita cambio a egresado - ${validated.degree_title}`,
          entity_type: 'graduation_request',
          entity_id: insertedReq.id,
          is_read: false,
          created_at: new Date().toISOString()
        }))

        await supabase.from('NOTIFICATION').insert(adminNotifications)
        console.log(`Notificación enviada a ${admins.length} administradores`)
      }
    } catch (notifError) {
      console.warn('Error creando notificaciones admin:', notifError)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Solicitud de graduado enviada. Estado: PENDING",
        data: {
          user: { id: upsertedUser.id, email: upsertedUser.email, role: upsertedUser.role, status: upsertedUser.status },
          request: { id: insertedReq.id, status: insertedReq.status, requested_at: insertedReq.requested_at },
        },
      },
      { status: 201, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error(" Error en API route graduates:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Error de validación de datos",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const msg = error instanceof Error ? error.message : "Error desconocido en el servidor"
    return NextResponse.json(
      { success: false, message: msg },
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Método GET no disponible para este endpoint. Use POST." },
    { status: 405, headers: { Allow: "POST", "Content-Type": "application/json" } }
  )
}

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabase } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// Esquema de validación con Zod
const studentSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  cedula: z.string().regex(/^\d{9}$/, "La cédula debe tener 9 dígitos numéricos"),
  carnet: z.string().regex(/^\d{7,10}$/, "El carnet debe tener entre 7 y 10 dígitos"),
  email: z
    .string()
    .email()
    .refine(
      (email) => email.endsWith("@estudiantec.cr") || email.endsWith("@itcr.ac.cr"),
      "Debe usar un correo institucional válido (@estudiantec.cr o @itcr.ac.cr)"
    ),
  personalEmail: z.string().email().optional().nullable(),
  phone: z.string().regex(/^\d{8}$/, "El teléfono debe tener 8 dígitos"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres").max(500),
  semester: z.number().int().min(1).max(10),
})

export async function POST(request: NextRequest) {
  try {
    console.log("📨 API Route: /api/register/students recibiendo solicitud...")

    const body = await request.json()
    console.log("📦 Datos recibidos:", JSON.stringify(body, null, 2))

    const validatedData = studentSchema.parse({
      ...body,
      semester: Number(body.semester),
    })

    // Cliente server (SSR). Ojo: este NO sirve para auth.admin
    const supabase = await createServerSupabase()

    // Verificar conexión (simple)
    const { error: connectionError } = await supabase
      .from("USERS")
      .select("id", { count: "exact", head: true })

    if (connectionError) {
      console.error("❌ Error de conexión a Supabase:", connectionError)
      throw new Error("Error de conexión a la base de datos")
    }

    console.log("🔍 Verificando unicidad de datos...")

    const { data: existingData, error: checkError } = await supabase
      .from("USERS")
      .select("id, email, cedula, carnet")
      .or(
        `email.eq.${validatedData.email.toLowerCase()},cedula.eq.${validatedData.cedula},carnet.eq.${validatedData.carnet}`
      )

    if (checkError) {
      console.error("❌ Error verificando datos:", checkError)
      throw new Error(`Error verificando datos: ${checkError.message}`)
    }

    if (existingData && existingData.length > 0) {
      const duplicate = existingData[0]
      if (duplicate.email === validatedData.email.toLowerCase()) throw new Error("Este correo institucional ya está registrado")
      if (duplicate.cedula === validatedData.cedula) throw new Error("Esta cédula ya está registrada")
      if (duplicate.carnet === validatedData.carnet) throw new Error("Este carnet ya está registrado")
    }

    // Preparar datos para insertar en USERS (tu tabla)
    const userData = {
      id: validatedData.user_id,
      email: validatedData.email.toLowerCase(),
      role: "STUDENT",
      status: "ACTIVE",
      name: validatedData.name.trim(),
      cedula: validatedData.cedula,
      phone: validatedData.phone,
      personalEmail: validatedData.personalEmail?.toLowerCase() || null,
      carnet: validatedData.carnet,
      semester: validatedData.semester.toString(),
      address: validatedData.address.trim(),
      created_at: new Date().toISOString(),
    }

    console.log("💾 Insertando datos en tabla USERS:", JSON.stringify(userData, null, 2))

    const { data: insertedData, error: insertError } = await supabase
      .from("USERS")
      .insert([userData])
      .select()
      .single()

    if (insertError) {
      console.error("❌ Error insertando usuario:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
      })

      if (insertError.code === "23505") throw new Error("Los datos ya están registrados en el sistema")
      if (insertError.code === "42501") throw new Error("Error de permisos. Contacte al administrador.")
      if (insertError.code === "PGRST301") throw new Error("Error de conexión con la base de datos")

      throw new Error(`Error al crear usuario: ${insertError.message}`)
    }

    console.log("✅ Usuario creado exitosamente:", insertedData.id)

    // ✅ Metadata en auth.users (REQUIERE service role)
    try {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(validatedData.user_id, {
        user_metadata: {
          name: validatedData.name,
          carnet: validatedData.carnet,
          cedula: validatedData.cedula,
          semester: validatedData.semester,
          role: "student",
        },
      })

      if (updateAuthError) console.warn("⚠️ Error actualizando metadata de auth (no crítico):", updateAuthError)
      else console.log("✅ Metadata de auth actualizada")
    } catch (authError) {
      console.warn("⚠️ Error en actualización de auth:", authError)
    }

    // Auditoría opcional
    try {
      const auditData = {
        user_id: validatedData.user_id,
        operation_type: "registration",
        ip_address:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        details: `Registro de estudiante: ${validatedData.name} (${validatedData.carnet})`,
        metadata: {
          email: validatedData.email,
          carnet: validatedData.carnet,
          cedula: validatedData.cedula,
          semester: validatedData.semester,
          source: "student_register_form",
        },
        created_at: new Date().toISOString(),
      }

      await supabase.from("audit_logs").insert([auditData])
      console.log("📋 Auditoría registrada")
    } catch (auditError) {
      console.warn("⚠️ Error en auditoría (no crítico):", auditError)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          id: insertedData.id,
          email: insertedData.email,
          name: insertedData.name,
          carnet: insertedData.carnet,
          semester: insertedData.semester,
        },
      },
      { status: 201, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("💥 Error en API route:", error)

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

    const errorMessage = error instanceof Error ? error.message : "Error desconocido en el servidor"

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
}

// Métodos HTTP no permitidos
export async function GET() {
  return NextResponse.json(
    { success: false, message: "Método GET no disponible para este endpoint. Use POST." },
    { status: 405, headers: { Allow: "POST", "Content-Type": "application/json" } }
  )
}
export async function PUT() {
  return NextResponse.json(
    { success: false, message: "Método PUT no disponible para este endpoint. Use POST." },
    { status: 405, headers: { Allow: "POST", "Content-Type": "application/json" } }
  )
}
export async function DELETE() {
  return NextResponse.json(
    { success: false, message: "Método DELETE no disponible para este endpoint. Use POST." },
    { status: 405, headers: { Allow: "POST", "Content-Type": "application/json" } }
  )
}

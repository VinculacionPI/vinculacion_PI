import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { z } from 'zod'

// Esquema para actualización (solo campos editables)
const updateProfileSchema = z.object({
  personalEmail: z.string().email().optional().nullable(),
  phone: z.string().regex(/^\d{8}$/, "El teléfono debe tener 8 dígitos"),
}).partial()

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Obtener usuario de la sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener perfil del estudiante
    const { data: profile, error: profileError } = await supabase
      .from('USERS')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { success: false, message: "Perfil no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    return NextResponse.json(
      { success: false, message: "Error del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Obtener usuario de la sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos
    const validatedData = updateProfileSchema.parse(body)
    
    // Preparar datos para actualizar
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    // Actualizar perfil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('USERS')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 400 }
      )
    }

    // Registrar auditoría
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        operation_type: 'profile_update',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        details: 'Actualización de perfil de estudiante',
        metadata: { updated_fields: Object.keys(validatedData) },
        created_at: new Date().toISOString()
      }])

    // Enviar notificación por email (simulado)
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          subject: 'Perfil Actualizado',
          template: 'profile-updated',
          data: {
            name: updatedProfile.name,
            updated_fields: Object.keys(validatedData)
          }
        }
      })
    } catch (emailError) {
      console.warn('Error enviando email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedProfile
    })

  } catch (error) {
    console.error('Error actualizando perfil:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error de validación',
          errors: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: "Error del servidor" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

// Esquema para actualización (solo campos editables)
const updateProfileSchema = z.object({
  personalEmail: z.string().email("Correo personal inválido").optional().nullable(),
  phone: z.string().regex(/^\d{8}$/, "El teléfono debe tener 8 dígitos"),
}).partial().refine(data => {
  // Al menos un campo debe estar presente
  return Object.keys(data).length > 0
}, "Debe proporcionar al menos un campo para actualizar")

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
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
      console.error('Error obteniendo perfil:', profileError)
      return NextResponse.json(
        { success: false, message: "Perfil no encontrado" },
        { status: 404 }
      )
    }

    // Limpiar datos sensibles (opcional)
    const safeProfile = {
      ...profile,
      // No enviar datos sensibles si es necesario
    }

    return NextResponse.json({
      success: true,
      data: safeProfile
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
    const supabase = await createServerSupabase()
    
    // Obtener usuario de la sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      )
    }

    let body;
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: "Cuerpo de la solicitud inválido" },
        { status: 400 }
      )
    }
    
    // Validar datos
    const validatedData = updateProfileSchema.parse(body)
    
    // Obtener perfil actual para comparar
    const { data: currentProfile, error: currentError } = await supabase
      .from('USERS')
      .select('*')
      .eq('id', user.id)
      .single()

    if (currentError) {
      return NextResponse.json(
        { success: false, message: "Perfil no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si hay cambios reales
    const hasChanges = Object.keys(validatedData).some(key => {
      const currentValue = currentProfile[key]
      const newValue = validatedData[key as keyof typeof validatedData]
      
      // Manejar null/undefined
      if (currentValue === null || currentValue === undefined) {
        return newValue !== null && newValue !== undefined
      }
      return currentValue !== newValue
    })

    if (!hasChanges) {
      return NextResponse.json({
        success: false,
        message: "No se detectaron cambios para actualizar"
      })
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Solo incluir campos que realmente están presentes
    if (validatedData.personalEmail !== undefined) {
      updateData.personalEmail = validatedData.personalEmail || null
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone
    }

    // Actualizar perfil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('USERS')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando perfil:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          message: updateError.message || "Error al actualizar perfil" 
        },
        { status: 400 }
      )
    }

    // Registrar auditoría
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        operation_type: 'profile_update',
        ip_address: ipAddress,
        details: 'Actualización de perfil de estudiante',
        metadata: { 
          updated_fields: Object.keys(validatedData),
          old_values: {
            personalEmail: currentProfile.personalEmail,
            phone: currentProfile.phone
          },
          new_values: updateData
        },
        created_at: new Date().toISOString()
      }])

    if (auditError) {
      console.warn('Error registrando auditoría:', auditError)
    }

    // Enviar notificación por email
    try {
      // Primero verificar si el usuario tiene email
      if (user.email) {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.email,
            subject: 'Perfil Actualizado - Sistema TFG',
            template: 'profile-updated',
            data: {
              name: updatedProfile.name || user.email.split('@')[0],
              updated_fields: Object.keys(validatedData),
              timestamp: new Date().toLocaleDateString('es-CR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          })
        })

        if (!emailResponse.ok) {
          console.warn('Error enviando email:', await emailResponse.text())
        }
      }
    } catch (emailError) {
      console.warn('Error enviando email:', emailError)
      // No fallar la operación principal por error de email
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
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Error del servidor" 
      },
      { status: 500 }
    )
  }
}

// Opcional: Método PATCH para actualizaciones parciales
export async function PATCH(request: NextRequest) {
  return PUT(request) // Puedes reusar la misma lógica
}

// Opcional: Método DELETE (si es necesario)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      )
    }

    // Por seguridad, no permitir eliminación completa del perfil
    // En su lugar, marcar como inactivo
    const { error: updateError } = await supabase
      .from('USERS')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, message: "Error al desactivar cuenta" },
        { status: 400 }
      )
    }

    // Cerrar sesión
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: "Cuenta desactivada exitosamente"
    })

  } catch (error) {
    console.error('Error desactivando cuenta:', error)
    return NextResponse.json(
      { success: false, message: "Error del servidor" },
      { status: 500 }
    )
  }
}
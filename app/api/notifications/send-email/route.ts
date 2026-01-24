import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, template, data } = body

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, message: "Correo electrónico inválido" },
        { status: 400 }
      )
    }

    // Crear cliente Supabase del lado del servidor
    const supabase = await createServerSupabase()
    
    let emailData: any = {
      to: to,
      subject: subject
    }

    // Construir contenido basado en el template
    switch (template) {
      case 'registration-success':
        if (!data?.name || !data?.email || !data?.carnet) {
          return NextResponse.json(
            { success: false, message: "Faltan datos para el template de registro" },
            { status: 400 }
          )
        }
        emailData = {
          ...emailData,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2563eb;">¡Bienvenido al Sistema TFG!</h1>
              <p>Estimado ${data.name},</p>
              <p>Su registro como estudiante ha sido exitoso. A continuación encontrará sus datos de acceso:</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📋 Información de su cuenta:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Correo Institucional:</strong> ${data.email}</li>
                  <li><strong>Número de Carné:</strong> ${data.carnet}</li>
                  <li><strong>Fecha de Registro:</strong> ${new Date().toLocaleDateString('es-CR')}</li>
                </ul>
              </div>
              
              <p>Para acceder al sistema, utilice sus credenciales en: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/login">${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/login</a></p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <p>Este es un correo automático, por favor no responda a este mensaje.</p>
                <p>Sistema de Gestión de TFG - Instituto Tecnológico de Costa Rica</p>
              </div>
            </div>
          `,
          text: `Bienvenido ${data.name}. Su registro ha sido exitoso. Correo: ${data.email}, Carné: ${data.carnet}. Acceda en: ${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/login`
        }
        break
        
      case 'profile-updated':
        if (!data?.name || !Array.isArray(data?.updated_fields)) {
          return NextResponse.json(
            { success: false, message: "Faltan datos para el template de actualización de perfil" },
            { status: 400 }
          )
        }
        emailData = {
          ...emailData,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #10b981;">Perfil Actualizado</h1>
              <p>Estimado ${data.name},</p>
              <p>Su perfil ha sido actualizado exitosamente.</p>
              
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📝 Cambios realizados:</h3>
                <p>Se han modificado los siguientes campos:</p>
                <ul>
                  ${data.updated_fields.map((field: string) => `<li>${field}</li>`).join('')}
                </ul>
                <p><strong>Fecha de actualización:</strong> ${new Date().toLocaleDateString('es-CR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              <p>Si no realizó estos cambios, por favor contacte al administrador inmediatamente.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <p>Este es un correo automático, por favor no responda a este mensaje.</p>
                <p>Sistema de Gestión de TFG - Instituto Tecnológico de Costa Rica</p>
              </div>
            </div>
          `,
          text: `Perfil actualizado para ${data.name}. Campos modificados: ${data.updated_fields.join(', ')}`
        }
        break
        
      case 'graduation-request':
        if (!data?.name || !data?.graduation_year || !data?.degree_title) {
          return NextResponse.json(
            { success: false, message: "Faltan datos para el template de graduación" },
            { status: 400 }
          )
        }
        emailData = {
          ...emailData,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #7c3aed;">Solicitud de Egreso Recibida</h1>
              <p>Estimado ${data.name},</p>
              <p>Su solicitud de cambio a egresado ha sido recibida exitosamente.</p>
              
              <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">🎓 Información de Graduación:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Año de Graduación:</strong> ${data.graduation_year}</li>
                  <li><strong>Título Obtenido:</strong> ${data.degree_title}</li>
                  <li><strong>Fecha de Solicitud:</strong> ${new Date().toLocaleDateString('es-CR')}</li>
                </ul>
              </div>
              
              <p><strong>⚠️ Importante:</strong> Su solicitud será revisada por el administrador en un plazo de 3-5 días hábiles.</p>
              <p>Recibirá una notificación cuando su solicitud sea aprobada o si se requiere información adicional.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <p>Este es un correo automático, por favor no responda a este mensaje.</p>
                <p>Sistema de Gestión de TFG - Instituto Tecnológico de Costa Rica</p>
              </div>
            </div>
          `,
          text: `Solicitud de egreso recibida para ${data.name}. Año: ${data.graduation_year}, Título: ${data.degree_title}.`
        }
        break
        
      default:
        emailData = {
          ...emailData,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h1>${subject}</h1><p>${data?.message || 'Notificación del sistema'}</p></div>`,
          text: subject + (data?.message ? `\n\n${data.message}` : '')
        }
    }

    // En producción, implementa un servicio de email real
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isTest = process.env.NODE_ENV === 'test'
    
    let emailSent = false
    let emailService = 'simulado'

    if (isDevelopment || isTest) {
      // Simular envío en desarrollo
      console.log('📧 Email simulado:', {
        to: emailData.to,
        subject: emailData.subject,
        template: template
      })
      emailSent = true
    } else {
      // En producción, implementar servicio real de email
        
      // Si no hay servicio configurado
      if (!emailSent) {
        console.warn('⚠️ Servicio de email no configurado para producción')
        emailSent = false
      }
    }

    // Registrar en auditoría
    await supabase
      .from("audit_logs")
      .insert([{
        operation_type: "email_notification",
        details: `Email ${template} ${emailSent ? 'enviado' : 'falló'} a ${to}`,
        metadata: { 
          template, 
          subject,
          recipient: to,
          environment: process.env.NODE_ENV,
          email_service: emailService,
          sent: emailSent
        },
        created_at: new Date().toISOString()
      }])

    return NextResponse.json({
      success: emailSent,
      message: emailSent ? "Email procesado exitosamente" : "Email no enviado (modo simulación/producción no configurado)",
      data: {
        to: emailData.to,
        subject: emailData.subject,
        template: template,
        environment: process.env.NODE_ENV,
        sent: emailSent,
        service: emailService
      }
    })

  } catch (error) {
    console.error('Error en API de notificaciones:', error)
    
    // Registrar error en auditoría
    try {
      const supabase = await createServerSupabase()
      await supabase
        .from("audit_logs")
        .insert([{
          operation_type: "email_notification_error",
          details: `Error enviando email: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          metadata: { 
            error: String(error),
            environment: process.env.NODE_ENV 
          },
          created_at: new Date().toISOString()
        }])
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError)
    }

    return NextResponse.json({
      success: false,
      message: "Error procesando notificación",
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import puppeteer from 'puppeteer-core'
import chromium from 'chrome-aws-lambda'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Increased for serverless Chrome initialization

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await req.json()
  const { publicacion_id } = body

  if (!publicacion_id) {
    return NextResponse.json({ error: "publicacion_id requerido" }, { status: 400 })
  }

  try {
    // Obtener datos de la oportunidad
    const { data: opp, error } = await supabase
      .from('OPPORTUNITY')
      .select('*')
      .eq('id', publicacion_id)
      .single()

    if (error || !opp) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 })
    }

    // Obtener datos de la empresa
    const { data: company } = await supabase
      .from('COMPANY')
      .select('name, email, sector')
      .eq('id', opp.company_id)
      .single()

    // Obtener datos específicos según tipo
    let extraData: any = {}

    if (opp.type === 'INTERNSHIP') {
      const { data } = await supabase
        .from('INTERNSHIP')
        .select('*')
        .eq('opportunity', publicacion_id)
        .single()
      extraData = data || {}
    } else if (opp.type === 'TFG') {
      const { data } = await supabase
        .from('TFG')
        .select('*')
        .eq('opportunity', publicacion_id)
        .single()
      extraData = data || {}
    } else if (opp.type === 'JOB') {
      const { data } = await supabase
        .from('JOB')
        .select('*')
        .eq('opportunity', publicacion_id)
        .single()
      extraData = data || {}
    }

    // Combinar datos
    const fullOpp = {
      ...opp,
      ...extraData,
      COMPANY: company
    }

    // Generar HTML del flyer
    const tipoLabel = 
      fullOpp.type === 'TFG' ? 'PROYECTO DE GRADUACIÓN' : 
      fullOpp.type === 'INTERNSHIP' ? 'PASANTÍA' : 'EMPLEO'

    let detallesHTML = ''
    
    if (fullOpp.type === 'INTERNSHIP' || fullOpp.type === 'TFG') {
      detallesHTML = `
        <div class="info-item">
          <strong>Modalidad</strong>
          ${fullOpp.mode || 'No especificado'}
        </div>
        <div class="info-item">
          <strong>Horario</strong>
          ${fullOpp.schedule || 'No especificado'}
        </div>
        <div class="info-item">
          <strong>Duración</strong>
          ${fullOpp.duration || 'No especificado'}
        </div>
        <div class="info-item">
          <strong>Remuneración</strong>
          ${fullOpp.remuneration ? '₡' + fullOpp.remuneration.toLocaleString('es-CR') : 'No especificado'}
        </div>
      `
    } else {
      // JOB
      detallesHTML = `
        <div class="info-item">
          <strong>Modalidad</strong>
          ${fullOpp.mode || 'No especificado'}
        </div>
        <div class="info-item">
          <strong>Tipo de Contrato</strong>
          ${fullOpp.contract_type || 'No especificado'}
        </div>
        <div class="info-item">
          <strong>Salario</strong>
          ${fullOpp.salary_min && fullOpp.salary_max 
            ? `₡${fullOpp.salary_min.toLocaleString('es-CR')} - ₡${fullOpp.salary_max.toLocaleString('es-CR')}` 
            : 'No especificado'}
        </div>
        <div class="info-item">
          <strong>Fecha de Inicio</strong>
          ${fullOpp.estimated_start_date 
            ? new Date(fullOpp.estimated_start_date).toLocaleDateString('es-CR')
            : 'No especificado'}
        </div>
      `
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      background: #667eea;
      padding: 20px;
    }
    .flyer {
      background: white;
      max-width: 800px;
      margin: 0 auto;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: #667eea;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.2em;
      margin-bottom: 10px;
    }
    .type-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: bold;
      margin-top: 8px;
      font-size: 0.9em;
    }
    .area-badge {
      display: inline-block;
      background: #764ba2;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      margin-top: 8px;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section h2 {
      color: #667eea;
      font-size: 1.3em;
      margin-bottom: 12px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 8px;
    }
    .section p, .section ul {
      line-height: 1.6;
      color: #333;
      font-size: 1em;
    }
    .section ul {
      list-style: none;
      padding-left: 0;
    }
    .section ul li {
      padding: 6px 0;
      padding-left: 22px;
      position: relative;
    }
    .section ul li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    .info-item strong {
      color: #667eea;
      display: block;
      margin-bottom: 4px;
      font-size: 0.85em;
      text-transform: uppercase;
    }
    .company {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 3px solid #667eea;
    }
    .company h3 {
      font-size: 1.5em;
      color: #333;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <h1>${fullOpp.title}</h1>
      <div class="type-badge">${tipoLabel}</div>
      ${fullOpp.area ? `<div class="area-badge">${fullOpp.area}</div>` : ''}
    </div>
    
    <div class="content">
      <div class="section">
        <h2>📋 Descripción</h2>
        <p>${fullOpp.description || 'Sin descripción'}</p>
      </div>
      
      <div class="section">
        <h2>📊 Detalles</h2>
        <div class="info-grid">
          ${detallesHTML}
        </div>
      </div>

      ${fullOpp.requirements ? `
      <div class="section">
        <h2>✅ Requisitos</h2>
        <ul>
          ${fullOpp.requirements.split('\n').filter(r => r.trim()).map(req => `<li>${req}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${fullOpp.type === 'JOB' && fullOpp.benefits ? `
      <div class="section">
        <h2>🎁 Beneficios</h2>
        <p>${fullOpp.benefits}</p>
      </div>
      ` : ''}

      <div class="section">
        <h2>📧 Contacto</h2>
        <p><strong>Email:</strong> ${fullOpp.contact_info || fullOpp.COMPANY?.email || 'Ver información de empresa'}</p>
      </div>
    </div>
    
    <div class="company">
      <h3>${fullOpp.COMPANY?.name || 'Empresa'}</h3>
      <p style="color: #666;">${fullOpp.COMPANY?.sector || ''}</p>
      <p style="margin-top: 8px; font-size: 0.9em;">${fullOpp.COMPANY?.email || ''}</p>
    </div>
  </div>
</body>
</html>
    `

    // Generar PDF con Puppeteer
    console.log('Lanzando Puppeteer...')
    
    // Detect if running locally or in serverless environment
    const isLocal = !process.env.AWS_REGION && !process.env.VERCEL
    
    const browser = await puppeteer.launch({
      args: isLocal 
        ? ['--no-sandbox', '--disable-setuid-sandbox']
        : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: isLocal 
        ? process.env.PUPPETEER_EXECUTABLE_PATH || '/home/jerson/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
        : await chromium.executablePath,
      headless: chromium.headless
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }
    })

    await browser.close()
    console.log('PDF generado exitosamente')

    // Subir a Supabase Storage
    const fileName = `flyer-${publicacion_id}-${Date.now()}.pdf`
    
    const { error: uploadError } = await supabase.storage
      .from('flyers')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Error subiendo PDF:', uploadError)
      throw uploadError
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('flyers')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Actualizar oportunidad con flyer_url
    const { error: updateError } = await supabase
      .from('OPPORTUNITY')
      .update({ flyer_url: publicUrl })
      .eq('id', publicacion_id)

    if (updateError) {
      console.error('Error actualizando flyer_url:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      data: { 
        pdf_url: publicUrl 
      },
      metadata: { generado_en: new Date().toISOString() }
    })

  } catch (error: any) {
    console.error('Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
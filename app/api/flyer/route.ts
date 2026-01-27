import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

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
      .select(`
        *,
        COMPANY (
          name,
          email,
          sector
        )
      `)
      .eq('id', publicacion_id)
      .single()

    if (error || !opp) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 })
    }

    // Generar HTML
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flyer - ${opp.title}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      background: #667eea;
      padding: 40px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .flyer {
      background: white;
      max-width: 800px;
      width: 100%;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: #667eea;
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .type-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      margin-top: 10px;
    }
    .area-badge {
      display: inline-block;
      background: #764ba2;
      color: white;
      padding: 5px 15px;
      border-radius: 15px;
      font-size: 0.9em;
      margin-top: 10px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #667eea;
      font-size: 1.5em;
      margin-bottom: 15px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .section p, .section ul {
      line-height: 1.8;
      color: #333;
      font-size: 1.1em;
    }
    .section ul {
      list-style: none;
      padding-left: 0;
    }
    .section ul li {
      padding: 8px 0;
      padding-left: 25px;
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
      gap: 20px;
      margin-top: 20px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    .info-item strong {
      color: #667eea;
      display: block;
      margin-bottom: 5px;
      font-size: 0.9em;
      text-transform: uppercase;
    }
    .company {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 3px solid #667eea;
    }
    .company h3 {
      font-size: 1.8em;
      color: #333;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <h1>${opp.title}</h1>
      <div class="type-badge">
        ${opp.type === 'TFG' ? 'PROYECTO DE GRADUACIÓN' : 
          opp.type === 'INTERNSHIP' ? 'PASANTÍA' : 'EMPLEO'}
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Descripción</h2>
        <p>${opp.description || 'Sin descripción'}</p>
      </div>
      
      <div class="section">
        <h2>Detalles</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Modalidad</strong>
            ${opp.mode || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Duración</strong>
            ${opp.duration || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Requisitos</strong>
            ${opp.requirements || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Contacto</strong>
            ${opp.contact_info || (opp as any).COMPANY?.email || 'Ver información'}
          </div>
        </div>
      </div>
    </div>
    
    <div class="company">
      <h3>${(opp as any).COMPANY?.name || 'Empresa'}</h3>
      <p>${(opp as any).COMPANY?.sector || ''}</p>
      <p style="margin-top: 10px;">${(opp as any).COMPANY?.email || ''}</p>
    </div>
  </div>
</body>
</html>
    `

    return NextResponse.json({
      success: true,
      data: { html },
      metadata: { generado_en: new Date().toISOString() }
    })

  } catch (error: any) {
    console.error('Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
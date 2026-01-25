// Se puede borrar
// app/api/opportunities/[id]/generate-flyer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = createRouteSupabase(req);

    // Obtener los datos de la oportunidad
    const { data: opportunity, error: oppError } = await supabase
      .from("OPPORTUNITY")
      .select("*")
      .eq("id", id)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: "Oportunidad no encontrada" },
        { status: 404 }
      );
    }

    // Generar HTML del flyer basado en los datos de la oportunidad
    const flyerHtml = generateFlyerHTML({
      title: opportunity.title,
      description: opportunity.description,
      mode: opportunity.mode,
      area: opportunity.area,
      requirements: opportunity.requirements,
      contact_info: opportunity.contact_info,
      company: opportunity.company_id,
    });

    return NextResponse.json({
      success: true,
      data: {
        html: flyerHtml,
      },
    });
  } catch (err: any) {
    console.error("Error generating flyer:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Función para escapar HTML
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Función para generar el HTML del flyer
function generateFlyerHTML(data: any): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.title)} - Oportunidad</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { border-bottom: 4px solid #0066cc; padding-bottom: 30px; margin-bottom: 30px; }
        .title { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
        .company { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .meta-item { border-left: 3px solid #0066cc; padding-left: 15px; }
        .meta-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; }
        .meta-value { font-size: 16px; color: #333; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #0066cc; margin-bottom: 15px; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
        .section-content { color: #555; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
        .requirements-list { list-style: none; }
        .requirements-list li { padding: 8px 0; padding-left: 25px; position: relative; }
        .requirements-list li:before { content: "✓"; position: absolute; left: 0; color: #0066cc; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="company">Oportunidad de Empleo</div>
            <div class="title">${escapeHtml(data.title)}</div>
        </div>

        <div class="meta">
            <div class="meta-item">
                <div class="meta-label">Modalidad</div>
                <div class="meta-value">${escapeHtml(data.mode || 'No especificado')}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Área</div>
                <div class="meta-value">${escapeHtml(data.area || 'No especificado')}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Descripción</div>
            <div class="section-content">${escapeHtml(data.description || '').replace(/\n/g, '<br>')}</div>
        </div>

        ${
          data.requirements
            ? `
        <div class="section">
            <div class="section-title">Requisitos</div>
            <ul class="requirements-list">
                ${data.requirements
                  .split('\n')
                  .filter((r: string) => r.trim())
                  .map((req: string) => `<li>${escapeHtml(req)}</li>`)
                  .join('')}
            </ul>
        </div>
        `
            : ''
        }

        <div class="section">
            <div class="section-title">Información de Contacto</div>
            <div class="section-content">${escapeHtml(data.contact_info || 'No especificado')}</div>
        </div>

        <div class="footer">
            <p>Esta oportunidad fue publicada en nuestra plataforma de vinculación</p>
            <p style="margin-top: 10px;">Generado automáticamente - ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
    </div>
</body>
</html>
  `;
}
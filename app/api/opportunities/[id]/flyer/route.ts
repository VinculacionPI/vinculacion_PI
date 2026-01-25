// app/api/opportunities/[id]/flyer/route.ts
// se puede borrar
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { supabase } = createRouteSupabase(req);
    const body = await req.json();
    const { flyer_html } = body;

    if (!flyer_html) {
      return NextResponse.json({ error: "flyer_html es requerido" }, { status: 400 });
    }

    // Convertir HTML a Blob
    const htmlBlob = new Blob([flyer_html], { type: "text/html" });
    
    // Generar nombre de archivo único
    const fileName = `flyer-${id}-${Date.now()}.html`;
    const filePath = `flyers/${fileName}`;

    // Subir a Storage (bucket "flyers")
    const { data: storageData, error: storageError } = await supabase.storage
      .from("flyers")
      .upload(filePath, htmlBlob, {
        contentType: "text/html",
        upsert: false,
      });

    if (storageError) throw storageError;

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from("flyers")
      .getPublicUrl(filePath);

    const flyerUrl = urlData.publicUrl;

    // Insertar en tabla "flyers"
    const { data: flyerRecord, error: flyerError } = await supabase
      .from("flyers")
      .insert([
        {
          opportunity_id: id,
          url: flyerUrl,
          formato: "html",
          file_path: filePath,
        },
      ])
      .select()
      .single();

    if (flyerError) throw flyerError;

    // Actualizar OPPORTUNITY.flyer_url
    const { data: oppData, error: oppError } = await supabase
      .from("OPPORTUNITY")
      .update({ flyer_url: flyerUrl })
      .eq("id", id)
      .select()
      .single();

    if (oppError) throw oppError;

    return NextResponse.json({
      success: true,
      flyer_url: flyerUrl,
      flyer_record: flyerRecord,
      opportunity: oppData,
    });
  } catch (err: any) {
    console.error("Error saving flyer:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
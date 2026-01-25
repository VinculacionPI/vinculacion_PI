import { supabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    console.log("formData keys:", Array.from(formData.keys()));

    const file = formData.get("logo") as File;
    if (!file) {
      console.log("No se encontró el archivo");
      return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 });
    }

    console.log("Archivo recibido:", file.name, file.size, file.type);

    const fileExt = file.name.split(".").pop();
    const fileName = `logos/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage
      .from("Logos")
      .upload(fileName, buffer, { contentType: file.type });

    if (error) {
      console.log("Error Supabase upload:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from("Logos").getPublicUrl(fileName);
    console.log("Public URL:", publicData?.publicUrl);

    if (!publicData?.publicUrl) {
      return NextResponse.json({ error: "No se pudo obtener la URL pública" }, { status: 500 });
    }

    return NextResponse.json({ publicUrl: publicData.publicUrl });
  } catch (err) {
    console.error("Catch error:", err);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
};

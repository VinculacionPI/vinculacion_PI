import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { companyName, companyEmail } = await req.json();

    // Configura tu transporte SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "vinculacionempresarial0@gmail.com",
        pass: "ipxe tekd vkcd dmcs",
      },
    });

    // Cuerpo del correo
    const info = await transporter.sendMail({
      from: '"Plataforma Vinculación" <vinculacionempresarial0@gmail.com>',
      to: "tvillarevia118740742@gmail.com", // admin
      subject: "Nueva solicitud de empresa pendiente",
      html: `
        <p>Se ha registrado una nueva empresa:</p>
        <ul>
          <li><strong>Nombre:</strong> ${companyName}</li>
          <li><strong>Correo:</strong> ${companyEmail}</li>
        </ul>
        <p>Por favor, revise y apruebe la solicitud en la plataforma.</p>
      `,
    });

    return NextResponse.json({ message: "Correo enviado", info });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
  }
}

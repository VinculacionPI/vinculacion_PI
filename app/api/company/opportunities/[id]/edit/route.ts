import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { message: "Endpoint aún no implementado" },
    { status: 501 } // Not Implemented
  )
}

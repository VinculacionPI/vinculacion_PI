import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // TODO: Replace with actual database update
    // Update company status to "approved"

    return NextResponse.json({ message: "Empresa aprobada exitosamente" })
  } catch (error) {
    console.error("[v0] Error approving company:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

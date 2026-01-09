import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // TODO: Replace with actual database update
    // Update opportunity status to "approved" or "active"

    return NextResponse.json({ message: "Oportunidad aprobada exitosamente" })
  } catch (error) {
    console.error("[v0] Error approving opportunity:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

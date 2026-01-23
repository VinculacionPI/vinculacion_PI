import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // TODO: Replace with actual database update
    // Update opportunity status to "rejected"

    return NextResponse.json({ message: "Oportunidad rechazada" })
  } catch (error) {
    console.error("[v0] Error rejecting opportunity:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

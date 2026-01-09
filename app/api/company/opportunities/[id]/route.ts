import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, description, type, location, salary, requirements } = body

    // TODO: Replace with actual database update
    // Validate and update opportunity

    if (!title || !description || !type || !location) {
      return NextResponse.json({ message: "Campos requeridos faltantes" }, { status: 400 })
    }

    const updatedOpportunity = {
      id: params.id,
      title,
      description,
      type,
      location,
      salary,
      requirements,
      company: "Tech Solutions CR",
      companyId: "company-1",
      status: "pending",
      postedAt: "Actualizado ahora",
    }

    return NextResponse.json(updatedOpportunity)
  } catch (error) {
    console.error("[v0] Error updating opportunity:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // TODO: Replace with actual database deletion
    // Soft delete or hard delete the opportunity

    return NextResponse.json({ message: "Oportunidad eliminada exitosamente" })
  } catch (error) {
    console.error("[v0] Error deleting opportunity:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    // TODO: Replace with actual registration logic
    // This is a placeholder that simulates API behavior

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (!["student", "graduate", "company"].includes(role)) {
      return NextResponse.json({ message: "Rol inválido" }, { status: 400 })
    }

    // Simulated response - replace with actual API call
    const mockUser = {
      id: "1",
      name,
      email,
      role,
    }

    return NextResponse.json(mockUser, { status: 201 })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

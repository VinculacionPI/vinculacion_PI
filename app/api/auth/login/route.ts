import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // TODO: Replace with actual authentication logic
    // This is a placeholder that simulates API behavior

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Simulated response - replace with actual API call
    const mockUser = {
      id: "1",
      email,
      role: "student", // This would come from your database
      name: "Usuario Demo",
    }

    return NextResponse.json(mockUser)
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

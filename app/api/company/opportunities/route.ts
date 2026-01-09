import { type NextRequest, NextResponse } from "next/server"

// Mock data
const mockCompanyOpportunities = [
  {
    id: "1",
    title: "Desarrollador Full Stack",
    company: "Tech Solutions CR",
    companyId: "company-1",
    location: "San José",
    type: "job",
    status: "active",
    description:
      "Buscamos un desarrollador full stack con experiencia en React y Node.js para unirse a nuestro equipo de desarrollo.",
    salary: "₡1,200,000 - ₡1,800,000",
    postedAt: "Hace 3 días",
  },
  {
    id: "2",
    title: "Práctica en Análisis de Datos",
    company: "Tech Solutions CR",
    companyId: "company-1",
    location: "Cartago",
    type: "internship",
    status: "pending",
    description: "Oportunidad de práctica profesional en análisis de datos y visualización con herramientas modernas.",
    postedAt: "Hace 1 día",
  },
  {
    id: "3",
    title: "Ingeniero DevOps",
    company: "Tech Solutions CR",
    companyId: "company-1",
    location: "Remoto",
    type: "job",
    status: "active",
    description: "Buscamos ingeniero DevOps con experiencia en AWS y Kubernetes.",
    salary: "₡2,000,000 - ₡2,800,000",
    postedAt: "Hace 1 semana",
  },
]

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    // Get opportunities for the authenticated company
    return NextResponse.json(mockCompanyOpportunities)
  } catch (error) {
    console.error("[v0] Error fetching company opportunities:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, type, location, salary, requirements } = body

    // TODO: Replace with actual database insertion
    // Validate and create new opportunity

    if (!title || !description || !type || !location) {
      return NextResponse.json({ message: "Campos requeridos faltantes" }, { status: 400 })
    }

    const newOpportunity = {
      id: Date.now().toString(),
      title,
      description,
      type,
      location,
      salary,
      requirements,
      company: "Tech Solutions CR",
      companyId: "company-1",
      status: "pending",
      postedAt: "Ahora",
    }

    return NextResponse.json(newOpportunity, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating opportunity:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

// Mock data for demonstration
const mockOpportunities = [
  {
    id: "1",
    title: "Desarrollador Full Stack",
    company: "Tech Solutions CR",
    location: "San José",
    type: "job",
    description:
      "Buscamos un desarrollador full stack con experiencia en React y Node.js para unirse a nuestro equipo de desarrollo.",
    salary: "₡1,200,000 - ₡1,800,000",
    postedAt: "Hace 3 días",
    status: "active",
  },
  {
    id: "2",
    title: "Práctica en Análisis de Datos",
    company: "Data Analytics Inc",
    location: "Cartago",
    type: "internship",
    description: "Oportunidad de práctica profesional en análisis de datos y visualización con herramientas modernas.",
    postedAt: "Hace 1 semana",
    status: "active",
  },
  {
    id: "3",
    title: "Proyecto: Sistema de Gestión Hospitalaria",
    company: "Hospital Clínica Bíblica",
    location: "San José",
    type: "graduation-project",
    description: "Desarrollo de un sistema de gestión hospitalaria con tecnologías web modernas.",
    postedAt: "Hace 2 días",
    status: "active",
  },
  {
    id: "4",
    title: "Ingeniero de Software Senior",
    company: "Amazon Web Services",
    location: "Remoto",
    type: "job",
    description: "Posición senior en AWS para trabajar en servicios cloud de alta escala.",
    salary: "₡3,000,000 - ₡4,500,000",
    postedAt: "Hace 5 días",
    status: "active",
  },
  {
    id: "5",
    title: "Práctica en Ciberseguridad",
    company: "SecureTech",
    location: "Heredia",
    type: "internship",
    description: "Práctica en el área de ciberseguridad, trabajando con tecnologías de protección de datos.",
    postedAt: "Hace 4 días",
    status: "active",
  },
  {
    id: "6",
    title: "Desarrollador Mobile iOS/Android",
    company: "MobileFirst CR",
    location: "San José",
    type: "job",
    description: "Desarrollo de aplicaciones móviles nativas para iOS y Android.",
    salary: "₡1,500,000 - ₡2,200,000",
    postedAt: "Hace 1 semana",
    status: "active",
  },
]

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    // This is a placeholder that returns mock data

    const searchParams = request.nextUrl.searchParams
    const graduate = searchParams.get("graduate")

    // Filter opportunities based on role
    let opportunities = mockOpportunities
    if (graduate === "true") {
      // For graduates, prioritize job opportunities
      opportunities = mockOpportunities.filter((opp) => opp.type === "job" || opp.type === "graduation-project")
    }

    return NextResponse.json(opportunities)
  } catch (error) {
    console.error("[v0] Error fetching opportunities:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

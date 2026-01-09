import { NextResponse } from "next/server"

const mockPendingCompanies = [
  {
    id: "1",
    name: "Tech Innovations CR",
    email: "contact@techinnovations.cr",
    website: "https://techinnovations.cr",
    description: "Empresa de desarrollo de software especializada en soluciones empresariales.",
    status: "pending",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Digital Marketing Solutions",
    email: "info@digitalmarketing.cr",
    website: "https://digitalmarketing.cr",
    description: "Agencia de marketing digital y estrategias de contenido.",
    status: "pending",
    createdAt: "2024-01-16",
  },
  {
    id: "3",
    name: "Cloud Services Inc",
    email: "hello@cloudservices.cr",
    website: "https://cloudservices.cr",
    description: "Proveedor de servicios cloud y consultoría en infraestructura.",
    status: "pending",
    createdAt: "2024-01-17",
  },
]

export async function GET() {
  try {
    // TODO: Replace with actual database query
    return NextResponse.json(mockPendingCompanies)
  } catch (error) {
    console.error("[v0] Error fetching pending companies:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

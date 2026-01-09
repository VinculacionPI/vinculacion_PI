import { NextResponse } from "next/server"

const mockPendingOpportunities = [
  {
    id: "pending-1",
    title: "Desarrollador Backend Node.js",
    company: "Tech Innovations CR",
    companyId: "1",
    location: "San José",
    type: "job",
    status: "pending",
    description: "Buscamos desarrollador backend con experiencia en Node.js y bases de datos NoSQL.",
    salary: "₡1,800,000 - ₡2,500,000",
    postedAt: "Hace 2 días",
    requirements: ["3+ años de experiencia", "Node.js y Express", "MongoDB o similar"],
  },
  {
    id: "pending-2",
    title: "Práctica en Diseño UX/UI",
    company: "Digital Marketing Solutions",
    companyId: "2",
    location: "Remoto",
    type: "internship",
    status: "pending",
    description: "Oportunidad de práctica en diseño de experiencias de usuario y interfaces.",
    postedAt: "Hace 1 día",
    requirements: ["Conocimientos en Figma", "Portafolio de diseño", "Estudiante activo"],
  },
]

export async function GET() {
  try {
    // TODO: Replace with actual database query
    return NextResponse.json(mockPendingOpportunities)
  } catch (error) {
    console.error("[v0] Error fetching pending opportunities:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

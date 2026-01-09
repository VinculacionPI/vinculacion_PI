import { OpportunityForm } from "@/components/company/opportunity-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getOpportunity(id: string) {
  // TODO: Replace with actual API call
  return {
    id,
    title: "Desarrollador Full Stack",
    description:
      "Buscamos un desarrollador full stack con experiencia en React y Node.js para unirse a nuestro equipo de desarrollo.",
    type: "job",
    location: "San José",
    salary: "₡1,200,000 - ₡1,800,000",
    requirements: [
      "Experiencia mínima de 2 años en desarrollo web",
      "Conocimientos sólidos en React y Node.js",
      "Experiencia con bases de datos SQL y NoSQL",
    ],
  }
}

export default async function EditOpportunityPage({ params }: { params: { id: string } }) {
  const opportunity = await getOpportunity(params.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/dashboard/company">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Editar Oportunidad</h1>
        <p className="text-muted-foreground">Actualiza los detalles de tu oportunidad</p>
      </div>

      <OpportunityForm initialData={opportunity} isEdit />
    </div>
  )
}

import { OpportunityForm } from "@/components/company/opportunity-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createServerSupabase } from "@/lib/supabase"

type OpportunityFormData = {
  id: string
  title: string
  description: string
  type: "TFG" | "PASANTIA" | "EMPLEO"
  mode: "PRESENCIAL" | "VIRTUAL" | "HÍBRIDO"
  duration_estimated: string
  requirements: string
  contact_info: string
}

/**
 * Obtener oportunidad real desde la DB
 */
async function getOpportunity(id: string): Promise<OpportunityFormData | null> {
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from("OPPORTUNITY")
    .select("id,title,description,type,mode,duration_estimated,requirements,contact_info")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching opportunity:", error)
    return null
  }

  return data as OpportunityFormData
}

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const opportunity = await getOpportunity(id)

  if (!opportunity) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/dashboard/company">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>

        <h1 className="text-xl font-bold">Oportunidad no encontrada</h1>
        <p className="text-muted-foreground mt-2">Verificá que el ID sea correcto o que la oportunidad exista.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/dashboard/company">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Editar Oportunidad</h1>
        <p className="text-muted-foreground">Actualiza los detalles de la oportunidad</p>
      </div>

      <OpportunityForm initialData={opportunity} isEdit />
    </div>
  )
}

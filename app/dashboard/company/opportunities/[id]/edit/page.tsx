import { OpportunityForm } from "@/components/company/opportunity-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"

async function getOpportunity(id: string) {
  try {
    const { data, error } = await supabase
      .from('OPPORTUNITY')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error obteniendo oportunidad:', error)
      return null
    }

    // Transformar al formato del formulario
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type === 'TFG' ? 'graduation-project' : 
            data.type === 'INTERNSHIP' ? 'internship' : 'job',
      location: data.mode || '',
      salary: '',
      requirements: data.requirements?.split('\n').filter(Boolean) || [''],
    }
  } catch (err) {
    console.error('Error:', err)
    return null
  }
}

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const opportunity = await getOpportunity(id)

  if (!opportunity) {
    notFound()
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Editar Oportunidad</h1>
        <p className="text-muted-foreground">Actualiza los detalles de tu oportunidad</p>
      </div>

      <OpportunityForm initialData={opportunity} isEdit={true} />
    </div>
  )
}

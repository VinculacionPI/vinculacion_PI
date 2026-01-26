import { OpportunityForm } from "@/components/company/opportunity-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"

async function getOpportunity(id: string) {
  try {
    const { data: opportunity, error } = await supabase
      .from("OPPORTUNITY")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !opportunity) {
      console.error("Error obteniendo OPPORTUNITY:", error)
      return null
    }

    const mappedType =
      opportunity.type === "INTERNSHIP"
        ? "internship"
        : opportunity.type === "TFG"
        ? "graduation-project"
        : "job"

    const baseData = {
      id: opportunity.id,
      title: opportunity.title ?? "",
      description: opportunity.description ?? "",
      type: mappedType,
      area: opportunity.area ?? "",
      contactInfo: opportunity.contact_info ?? "",
      requirements: opportunity.requirements
        ? opportunity.requirements.split("\n").filter(Boolean)
        : [""],
      lifecycle_status: opportunity.lifecycle_status ?? "",
    }

    if (mappedType === "internship") {
      const { data } = await supabase
        .from("INTERNSHIP")
        .select("*")
        .eq("opportunity", id)
        .single()

      return {
        ...baseData,
        duration: data?.duration ?? "",
        schedule: data?.schedule ?? "",
        salary: data?.remuneration?.toString() ?? "",
      }
    }

    if (mappedType === "graduation-project") {
      const { data } = await supabase
        .from("TFG")
        .select("*")
        .eq("opportunity", id)
        .single()

      return {
        ...baseData,
        duration: data?.duration ?? "",
        schedule: data?.schedule ?? "",
        salary: data?.remuneration?.toString() ?? "",
      }
    }

    // JOB
    const { data } = await supabase
      .from("JOB")
      .select("*")
      .eq("opportunity", id)
      .single()

    return {
      ...baseData,
      contractType: data?.contract_type ?? "",
      salary:
        data?.salary_min && data?.salary_max
          ? `${data.salary_min} - ${data.salary_max}`
          : "",
      benefits: data?.benefits ?? "",
      startDate: data?.estimated_start_date ?? "",
    }
  } catch (err) {
    console.error("Error general getOpportunity:", err)
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

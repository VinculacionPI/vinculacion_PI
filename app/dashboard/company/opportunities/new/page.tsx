export const dynamic = 'force-dynamic'

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OpportunityForm } from "@/components/company/opportunity-form"

export default function NewOpportunityPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/dashboard/company">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nueva Publicación</h1>
        <p className="text-muted-foreground">
          Registra una nueva oportunidad para tu empresa
        </p>
      </div>

      <OpportunityForm />
    </div>
  )
}

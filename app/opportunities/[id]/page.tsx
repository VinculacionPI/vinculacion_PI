"use client"

import { use, useEffect, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { FlyerButton } from "@/components/opportunities/flyer-button"
import { LoadingState } from "@/components/shared/loading-state"
import { supabase } from "@/lib/supabase"
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [opportunity, setOpportunity] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOpportunity() {
      try {
        const { data, error } = await supabase
          .from('OPPORTUNITY')
          .select(`
            *,
            COMPANY (
              name,
              email,
              sector,
              logo_path
            )
          `)
          .eq('id', id)
          .single()
        
        if (error || !data) {
          console.error('Error obteniendo oportunidad:', error)
          setOpportunity(null)
          return
        }
        
        setOpportunity({
                  id: data.id,
                  title: data.title,
                  company: data.COMPANY?.name || 'Empresa',
                  companyLogo: data.COMPANY?.logo_path || '/generic-company-logo.png',
                  location: data.mode || 'No especificado',
                  type: data.type === 'TFG' ? 'graduation-project' : 
                        data.type === 'PASANTIA' ? 'internship' : 'job',
                  status: data.status === 'OPEN' ? 'active' : 'inactive',
                  description: data.description || 'Sin descripción',
                  requirements: data.requirements?.split('\n').filter(Boolean) || [],
                  responsibilities: [],
                  benefits: [],
                  salary: null,
                  postedAt: new Date(data.created_at).toLocaleDateString('es-CR'),
                  expiresAt: 'No especificado',
                  contactEmail: data.contact_info || data.COMPANY?.email || '',
                  website: null,
                  flyer_url: data.flyer_url || null,
                })
        import('@/lib/services/api').then(({ registrarVisualizacion }) => {
          registrarVisualizacion(id).catch(err => console.log('Error registrando visualización:', err))
        })
      } catch (err) {
        console.error('Error cargando oportunidad:', err)
        setOpportunity(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadOpportunity()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <LoadingState message="Cargando oportunidad..." />
      </div>
    )
  }

  if (!opportunity) {
    notFound()
  }

  const typeLabels = {
    internship: "Práctica Profesional",
    "graduation-project": "Proyecto de Graduación",
    job: "Empleo",
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard/student">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a oportunidades
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{opportunity.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4" />
                      {opportunity.company}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {typeLabels[opportunity.type as keyof typeof typeLabels]}
                  </Badge>
                  {opportunity.salary && (
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" />
                      {opportunity.salary}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {opportunity.location}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {opportunity.postedAt}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Descripción</h3>
                  <p className="text-muted-foreground leading-relaxed">{opportunity.description}</p>
                </div>

                <Separator />

                {opportunity.requirements && opportunity.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Requisitos</h3>
                    <ul className="space-y-2">
                      {opportunity.requirements.map((req: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Aplicar a esta oportunidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Aplicar Ahora
                </Button>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Fecha de expiración</p>
                      <p className="text-muted-foreground">{opportunity.expiresAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Empresa</p>
                      <p className="text-muted-foreground">{opportunity.company}</p>
                    </div>
                  </div>

                  {opportunity.contactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Contacto</p>
                        <p className="text-muted-foreground">{opportunity.contactEmail}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <Button variant="outline" className="w-full bg-transparent">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Guardar para después
                </Button>

                      <FlyerButton 
                  opportunityId={id} 
                  currentFlyerUrl={opportunity.flyer_url}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

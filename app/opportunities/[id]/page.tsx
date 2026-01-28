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
  TrendingUp,
  GraduationCap,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth/get-current-user"

interface OpportunityDetails {
  id: string
  title: string
  company: string
  companyLogo: string
  location: string
  type: 'internship' | 'graduation-project' | 'job'
  status: string
  description: string
  requirements: string[]
  postedAt: string
  expiresAt: string
  contactEmail: string
  flyer_url: string | null
  area?: string
  duration?: string
  viewCount?: number
  // Datos específicos de JOB
  contractType?: string
  salaryMin?: number
  salaryMax?: number
  benefits?: string[]
  estimatedStartDate?: string
  // Datos específicos de TFG e INTERNSHIP
  schedule?: string
  remuneration?: number
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [opportunity, setOpportunity] = useState<OpportunityDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadOpportunity() {
      try {
        // Primero obtenemos la oportunidad base
        const { data: oppData, error: oppError } = await supabase
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
        
        if (oppError || !oppData) {
          console.error('Error obteniendo oportunidad:', oppError)
          setOpportunity(null)
          return
        }

        // Determinamos el tipo de oportunidad
        const oppType = oppData.type?.toUpperCase()
        
        let specificData = null

        // Obtenemos datos específicos según el tipo
        if (oppType === 'JOB' || oppType === 'EMPLEO') {
          const { data: jobData } = await supabase
            .from('JOB')
            .select('*')
            .eq('opportunity', id)
            .single()
          
          specificData = jobData
        } else if (oppType === 'TFG') {
          const { data: tfgData } = await supabase
            .from('TFG')
            .select('*')
            .eq('opportunity', id)
            .single()
          
          specificData = tfgData
        } else if (oppType === 'PASANTIA' || oppType === 'INTERNSHIP') {
          const { data: internshipData } = await supabase
            .from('INTERNSHIP')
            .select('*')
            .eq('opportunity', id)
            .single()
          
          specificData = internshipData
        }

        // Construimos el objeto de oportunidad completo
        const opportunityDetails: OpportunityDetails = {
          id: oppData.id,
          title: oppData.title || 'Sin título',
          company: oppData.COMPANY?.name || 'Empresa',
          companyLogo: oppData.COMPANY?.logo_path || '/generic-company-logo.png',
          location: oppData.mode || 'No especificado',
          type: oppType === 'TFG' ? 'graduation-project' : 
                oppType === 'PASANTIA' || oppType === 'INTERNSHIP' ? 'internship' : 'job',
          status: oppData.status === 'OPEN' ? 'active' : 'inactive',
          description: oppData.description || 'Sin descripción',
          requirements: oppData.requirements?.split('\n').filter(Boolean) || [],
          postedAt: new Date(oppData.created_at).toLocaleDateString('es-CR'),
          expiresAt: oppData.expires_at ? new Date(oppData.expires_at).toLocaleDateString('es-CR') : 'No especificado',
          contactEmail: oppData.contact_info || oppData.COMPANY?.email || '',
          flyer_url: oppData.flyer_url || null,
          area: oppData.area || undefined,
          duration: oppData.duration || specificData?.duration || undefined,
          viewCount: oppData.view_count || 0,
        }

        // Agregamos datos específicos según el tipo
        if (oppType === 'JOB' || oppType === 'EMPLEO') {
          if (specificData) {
            opportunityDetails.contractType = specificData.contract_type || 'No especificado'
            opportunityDetails.salaryMin = specificData.salary_min || 0
            opportunityDetails.salaryMax = specificData.salary_max || 0
            opportunityDetails.benefits = specificData.benefits?.split('\n').filter(Boolean) || []
            opportunityDetails.estimatedStartDate = specificData.estimated_start_date 
              ? new Date(specificData.estimated_start_date).toLocaleDateString('es-CR')
              : undefined
          }
        } else if (oppType === 'TFG' || oppType === 'PASANTIA' || oppType === 'INTERNSHIP') {
          if (specificData) {
            opportunityDetails.schedule = specificData.schedule || 'No especificado'
            opportunityDetails.remuneration = specificData.remuneration || 0
          }
        }

        setOpportunity(opportunityDetails)

        // Registrar visualización (comentado como en el original)
        // import('@/lib/services/api').then(({ registrarVisualizacion }) => {
        //   registrarVisualizacion(id).catch(err => console.log('Error registrando visualización:', err))
        // })
      } catch (err) {
        console.error('Error cargando oportunidad:', err)
        setOpportunity(null)
      } finally {
        setIsLoading(false)
      }
    }

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        console.error('Error cargando usuario:', err)
      }
    }

    loadOpportunity()
    loadUser()
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

  const typeIcons = {
    internship: <Briefcase className="h-4 w-4" />,
    "graduation-project": <GraduationCap className="h-4 w-4" />,
    job: <TrendingUp className="h-4 w-4" />,
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {user ? (
          <Link href={`/dashboard/${user.user_metadata?.role || 'student'}`}>
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search)
                const from = urlParams.get('from')
                
                if (from === 'company-dashboard') {
                  window.location.href = '/dashboard/company'
                } else if (user?.user_metadata?.role === 'company') {
                  window.location.href = '/dashboard/company'
                } else if (user?.user_metadata?.role === 'student') {
                  window.location.href = '/dashboard/student'
                } else if (user?.user_metadata?.role === 'graduate') {
                  window.location.href = '/dashboard/graduate'
                } else {
                  window.location.href = '/opportunities'
                }
              }}
              disabled={!user}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        ) : null}

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
                  <Badge variant="secondary" className="bg-primary text-primary-foreground flex items-center gap-1">
                    {typeIcons[opportunity.type]}
                    {typeLabels[opportunity.type]}
                  </Badge>
                  
                  {/* Salario para empleos */}
                  {opportunity.type === 'job' && opportunity.salaryMin !== undefined && opportunity.salaryMax !== undefined && (
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" />
                      {opportunity.salaryMin > 0 || opportunity.salaryMax > 0
                        ? `₡${opportunity.salaryMin.toLocaleString()} - ₡${opportunity.salaryMax.toLocaleString()}`
                        : 'A convenir'}
                    </Badge>
                  )}

                  {/* Remuneración para TFG y pasantías */}
                  {(opportunity.type === 'graduation-project' || opportunity.type === 'internship') && 
                   opportunity.remuneration !== undefined && (
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" />
                      {opportunity.remuneration > 0 
                        ? `₡${opportunity.remuneration.toLocaleString()}`
                        : 'Sin remuneración'}
                    </Badge>
                  )}

                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {opportunity.location}
                  </Badge>

                  {opportunity.duration && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {opportunity.duration}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Descripción</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
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

                {/* Beneficios para empleos */}
                {opportunity.type === 'job' && opportunity.benefits && opportunity.benefits.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">Beneficios</h3>
                      <ul className="space-y-2">
                        {opportunity.benefits.map((benefit: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Horario para TFG y pasantías */}
                {(opportunity.type === 'graduation-project' || opportunity.type === 'internship') && 
                 opportunity.schedule && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">Horario</h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{opportunity.schedule}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Tipo de contrato para empleos */}
                  {opportunity.type === 'job' && opportunity.contractType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Tipo de contrato</p>
                        <p className="text-muted-foreground">{opportunity.contractType}</p>
                      </div>
                    </div>
                  )}

                  {/* Fecha de inicio estimada para empleos */}
                  {opportunity.type === 'job' && opportunity.estimatedStartDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Fecha de inicio estimada</p>
                        <p className="text-muted-foreground">{opportunity.estimatedStartDate}</p>
                      </div>
                    </div>
                  )}

                  {/* Área */}
                  {opportunity.area && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Área</p>
                        <p className="text-muted-foreground">{opportunity.area}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Publicado</p>
                      <p className="text-muted-foreground">{opportunity.postedAt}</p>
                    </div>
                  </div>

                  {opportunity.expiresAt !== 'No especificado' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Fecha de expiración</p>
                        <p className="text-muted-foreground">{opportunity.expiresAt}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Empresa</p>
                      <p className="text-muted-foreground">{opportunity.company}</p>
                    </div>
                  </div>

                  {opportunity.contactEmail && (
                    <div className="flex items-start gap-2 text-sm">
                      <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">Contacto</p>
                        <p className="text-muted-foreground break-words">{opportunity.contactEmail}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

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
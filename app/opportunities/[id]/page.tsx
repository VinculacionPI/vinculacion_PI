import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/shared/dashboard-header"
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

async function getOpportunity(id: string) {
  // TODO: Replace with actual API call
  // Simulated API response
  return {
    id,
    title: "Desarrollador Full Stack",
    company: "Tech Solutions CR",
    companyLogo: "/generic-company-logo.png",
    location: "San José",
    type: "job",
    status: "active",
    description:
      "Buscamos un desarrollador full stack con experiencia en React y Node.js para unirse a nuestro equipo de desarrollo. Trabajarás en proyectos innovadores para clientes nacionales e internacionales.",
    requirements: [
      "Experiencia mínima de 2 años en desarrollo web",
      "Conocimientos sólidos en React y Node.js",
      "Experiencia con bases de datos SQL y NoSQL",
      "Conocimientos en Git y metodologías ágiles",
      "Inglés intermedio-avanzado",
    ],
    responsibilities: [
      "Desarrollar y mantener aplicaciones web full stack",
      "Colaborar con el equipo de diseño y producto",
      "Participar en revisiones de código y mejoras continuas",
      "Documentar código y procesos técnicos",
    ],
    benefits: [
      "Salario competitivo según experiencia",
      "Seguro médico privado",
      "Oportunidades de crecimiento profesional",
      "Ambiente de trabajo flexible",
      "Capacitación continua",
    ],
    salary: "₡1,200,000 - ₡1,800,000",
    postedAt: "Hace 3 días",
    expiresAt: "2024-02-15",
    contactEmail: "rrhh@techsolutions.cr",
    website: "https://techsolutions.cr",
  }
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opportunity = await getOpportunity(params.id)

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
          {/* Main Content */}
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
                      {opportunity.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {opportunity.responsibilities && opportunity.responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Responsabilidades</h3>
                    <ul className="space-y-2">
                      {opportunity.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-chart-3 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {opportunity.benefits && opportunity.benefits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Beneficios</h3>
                    <ul className="space-y-2">
                      {opportunity.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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

                  {opportunity.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Sitio web</p>
                        <a
                          href={opportunity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visitar
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <Button variant="outline" className="w-full bg-transparent">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Guardar para después
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, Building2, GraduationCap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Vinculación Empresarial EIPI</h1>
              <p className="text-xs text-muted-foreground">Instituto Tecnológico de Costa Rica</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Conectando talento TEC con oportunidades profesionales
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
            Plataforma oficial del Instituto Tecnológico de Costa Rica para prácticas profesionales, proyectos de
            graduación y ofertas laborales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Explorar Oportunidades
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
            ¿Quién puede usar la plataforma?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-lg border border-border">
              <GraduationCap className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-lg font-semibold mb-2 text-foreground">Estudiantes</h4>
              <p className="text-muted-foreground text-sm">
                Encuentra prácticas profesionales y proyectos de graduación alineados con tu carrera.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <Users className="h-12 w-12 text-accent mb-4" />
              <h4 className="text-lg font-semibold mb-2 text-foreground">Graduados</h4>
              <p className="text-muted-foreground text-sm">
                Accede a oportunidades laborales exclusivas para egresados del TEC.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <Building2 className="h-12 w-12 text-chart-3 mb-4" />
              <h4 className="text-lg font-semibold mb-2 text-foreground">Empresas</h4>
              <p className="text-muted-foreground text-sm">
                Publica ofertas y conecta con talento calificado del Instituto Tecnológico.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <Briefcase className="h-12 w-12 text-chart-4 mb-4" />
              <h4 className="text-lg font-semibold mb-2 text-foreground">Administradores</h4>
              <p className="text-muted-foreground text-sm">
                Gestiona aprobaciones y supervisa la calidad de las oportunidades publicadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary text-primary-foreground rounded-lg p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-balance">¿Listo para comenzar tu búsqueda?</h3>
          <p className="text-lg mb-6 opacity-90 text-pretty">
            Únete a la comunidad TEC y descubre tu próxima oportunidad profesional.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Crear Cuenta Gratis
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

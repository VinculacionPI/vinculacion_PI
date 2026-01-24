"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  obtenerDashboardEmpresa,
  explorarOportunidades,
} from "@/lib/services/persona5-backend"

export default function TestPersona5Page() {
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testExplorarOportunidades = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await explorarOportunidades({
        busqueda: '',
        tipo: [],
        pagina: 1,
        limite: 5
      })
      setResultado(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      // Reemplaza esto con un company_id real
      const empresaId = 'PASTE-COMPANY-ID-AQUI'
      
      const result = await obtenerDashboardEmpresa(empresaId, 30)
      setResultado(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Test Backend - Persona 5</h1>

      <div className="grid gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>CU-013: Explorar Oportunidades</CardTitle>
            <CardDescription>
              Prueba la Edge Function de búsqueda y filtrado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testExplorarOportunidades} 
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Probar Exploración'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CU-010: Dashboard Empresarial</CardTitle>
            <CardDescription>
              Prueba las métricas consolidadas (necesita company_id)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testDashboard} 
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Probar Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-muted rounded">
        <h3 className="font-bold mb-2">📝 Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Primero prueba "Explorar Oportunidades" (no requiere autenticación)</li>
          <li>Si funciona, verás oportunidades de la base de datos</li>
          <li>Para Dashboard, necesitas un company_id real de la BD</li>
          <li>Ejecuta en SQL Editor: SELECT id FROM COMPANY LIMIT 1;</li>
          <li>Copia el ID y reemplázalo en el código arriba (línea 39)</li>
        </ol>
      </div>
    </div>
  )
}
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardStatsProps {
  data: {
    metricas_generales: {
      total_publicaciones: number
      publicaciones_activas: number
      publicaciones_concretadas: number
      total_interesados: number
      total_visualizaciones: number
      tasa_concrecion: number
    }
    evolucion_temporal: Array<{ fecha: string; cantidad: number }>
    distribucion_carrera: Array<{ carrera: string; cantidad: number }>
    top_publicaciones: Array<{
      titulo: string
      tipo: string
      total_intereses: number
      total_visualizaciones: number
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function DashboardStats({ data }: DashboardStatsProps) {
  // Validación de datos
  if (!data || !data.metricas_generales) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Valores seguros con fallbacks
  const evolucionTemporal = data.evolucion_temporal || []
  const distribucionCarrera = data.distribucion_carrera || []
  const topPublicaciones = data.top_publicaciones || []

  return (
    <div className="space-y-6">
      {/* Gráfico de Evolución Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Intereses</CardTitle>
          <CardDescription>Últimos 30 días</CardDescription>
        </CardHeader>
        <CardContent>
          {evolucionTemporal.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucionTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(fecha) => new Date(fecha).toLocaleDateString('es-CR', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(fecha) => new Date(fecha).toLocaleDateString('es-CR')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Intereses"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos de evolución temporal</p>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Distribución por Carrera */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Carrera</CardTitle>
          <CardDescription>Interesados según su carrera</CardDescription>
        </CardHeader>
        <CardContent>
          {distribucionCarrera.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribucionCarrera}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ carrera, cantidad }) => `${carrera}: ${cantidad}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {distribucionCarrera.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos de distribución por carrera</p>
          )}
        </CardContent>
      </Card>

      {/* Top Publicaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Top Publicaciones</CardTitle>
          <CardDescription>Las más populares</CardDescription>
        </CardHeader>
        <CardContent>
          {topPublicaciones.length > 0 ? (
            <div className="space-y-4">
              {topPublicaciones.map((pub, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{pub.titulo}</p>
                    <p className="text-sm text-muted-foreground">{pub.tipo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">👥 {pub.total_intereses} intereses</p>
                    <p className="text-sm text-muted-foreground">{pub.total_visualizaciones} vistas</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay publicaciones todavía</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
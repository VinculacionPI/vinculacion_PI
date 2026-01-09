"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { CheckCircle, XCircle, Eye, Briefcase } from "lucide-react"
import type { Opportunity } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function OpportunityApprovalsTable() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPendingOpportunities()
  }, [])

  const fetchPendingOpportunities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/opportunities/pending")
      const data = await response.json()
      setOpportunities(data)
    } catch (error) {
      console.error("[v0] Error fetching pending opportunities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/opportunities/${id}/approve`, {
        method: "POST",
      })

      if (response.ok) {
        setOpportunities(opportunities.filter((o) => o.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error approving opportunity:", error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/opportunities/${id}/reject`, {
        method: "POST",
      })

      if (response.ok) {
        setOpportunities(opportunities.filter((o) => o.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error rejecting opportunity:", error)
    }
  }

  const typeLabels = {
    internship: "Práctica",
    "graduation-project": "Proyecto",
    job: "Empleo",
  }

  if (isLoading) {
    return <LoadingState message="Cargando oportunidades pendientes..." />
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Briefcase}
            title="No hay oportunidades pendientes"
            description="Todas las oportunidades publicadas han sido revisadas."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oportunidades Pendientes de Aprobación</CardTitle>
        <CardDescription>Revisa y aprueba las oportunidades publicadas por empresas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell className="font-medium">{opportunity.title}</TableCell>
                  <TableCell>{opportunity.company}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{typeLabels[opportunity.type]}</Badge>
                  </TableCell>
                  <TableCell>{opportunity.location}</TableCell>
                  <TableCell>{opportunity.postedAt}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                      Pendiente
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalles</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{opportunity.title}</DialogTitle>
                            <DialogDescription>{opportunity.company}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Badge variant="secondary">{typeLabels[opportunity.type]}</Badge>
                              <Badge variant="outline">{opportunity.location}</Badge>
                              {opportunity.salary && <Badge variant="outline">{opportunity.salary}</Badge>}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Descripción</p>
                              <p className="text-sm text-muted-foreground mt-1">{opportunity.description}</p>
                            </div>
                            {opportunity.requirements && opportunity.requirements.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">Requisitos</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                                  {opportunity.requirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">Fecha de Publicación</p>
                              <p className="text-sm text-muted-foreground">{opportunity.postedAt}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="default" size="sm" onClick={() => handleApprove(opportunity.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleReject(opportunity.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { CheckCircle, XCircle, Eye, Building2 } from "lucide-react"
import type { Company } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CompanyApprovalsTable() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPendingCompanies()
  }, [])

  const fetchPendingCompanies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/companies/pending")
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error("[v0] Error fetching pending companies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${id}/approve`, {
        method: "POST",
      })

      if (response.ok) {
        setCompanies(companies.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error approving company:", error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${id}/reject`, {
        method: "POST",
      })

      if (response.ok) {
        setCompanies(companies.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error rejecting company:", error)
    }
  }

  if (isLoading) {
    return <LoadingState message="Cargando empresas pendientes..." />
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Building2}
            title="No hay empresas pendientes"
            description="Todas las solicitudes de registro de empresas han sido procesadas."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empresas Pendientes de Aprobación</CardTitle>
        <CardDescription>Revisa y aprueba las solicitudes de registro de empresas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sitio Web</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visitar
                      </a>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{company.createdAt}</TableCell>
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
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{company.name}</DialogTitle>
                            <DialogDescription>Detalles de la empresa</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">{company.email}</p>
                            </div>
                            {company.description && (
                              <div>
                                <p className="text-sm font-medium">Descripción</p>
                                <p className="text-sm text-muted-foreground">{company.description}</p>
                              </div>
                            )}
                            {company.website && (
                              <div>
                                <p className="text-sm font-medium">Sitio Web</p>
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {company.website}
                                </a>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">Fecha de Registro</p>
                              <p className="text-sm text-muted-foreground">{company.createdAt}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="default" size="sm" onClick={() => handleApprove(company.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleReject(company.id)}>
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

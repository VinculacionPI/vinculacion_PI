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
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function CompanyApprovalsTable() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [openRejectModal, setOpenRejectModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchPendingCompanies()
  }, [])

  const fetchPendingCompanies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/companies/pending")
      const data = await response.json()
      // Asegurarse que sea un array
      setCompanies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error fetching pending companies:", error)
      setCompanies([])
    } finally {
      setIsLoading(false)
    }
  }


  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${id}/approve`, {
        method: "POST",
      })

      const data = await response.json()
      
      // Mostrar siempre el mensaje del backend
      console.log("[v0] Respuesta approve_company_admin:", data.message, data.code)

      if (data.code === 1) {
        // Actualizar la lista desde la base
        await fetchPendingCompanies()
      } else {
        // Mostrar mensaje exacto del backend
        console.error("[v0] Error aprobando empresa:", data.message)
      }
    } catch (error) {
      console.error("[v0] Error aprobando empresa:", error)
    }
  }

  const handleOpenRejectModal = (company: Company) => {
    setSelectedCompany(company)
    setRejectReason("")
    setErrorMessage("")
    setOpenRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectReason || rejectReason.length < 20) {
      setErrorMessage("El motivo debe tener al menos 20 caracteres")
      return
    }
    if (!selectedCompany) return

    setIsRejecting(true)
    try {
      const response = await fetch(`/api/admin/companies/${selectedCompany.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (response.ok) {
        // Actualizar la lista desde la base
        await fetchPendingCompanies()
        setOpenRejectModal(false)
      } else {
        const data = await response.json()
        setErrorMessage(data.error || "No se pudo rechazar la empresa")
      }
    } catch (error) {
      console.error("[v0] Error rejecting company:", error)
      setErrorMessage("No se pudo rechazar la empresa")
    } finally {
      setIsRejecting(false)
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
    <>
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

                        <Button variant="destructive" size="sm" onClick={() => handleOpenRejectModal(company)}>
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

      {/* MODAL RECHAZAR */}
      <Dialog open={openRejectModal} onOpenChange={setOpenRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar empresa</DialogTitle>
            <DialogDescription>
              Ingresa el motivo del rechazo (mínimo 20 caracteres)
            </DialogDescription>
          </DialogHeader>

          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Escribe el motivo..."
            className="mb-2 mt-2"
          />
          {errorMessage && <p className="text-red-600 text-sm mb-2">{errorMessage}</p>}

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenRejectModal(false)} disabled={isRejecting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
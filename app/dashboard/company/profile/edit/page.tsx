"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function EditCompanyProfilePage() {
  const router = useRouter()
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetch("/api/company/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setCompany(data?.company))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let logoPath = company.logo_path || null

      if (logoFile) {
        const formData = new FormData()
        formData.append("logo", logoFile)

        const uploadRes = await fetch("/api/company/upload-logo", {
          method: "POST",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok || !uploadData.publicUrl) {
          throw new Error("No se pudo subir el logo")
        }

        logoPath = uploadData.publicUrl
      }

      const res = await fetch("/api/company/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: company.name,
          sector: company.sector,
          description: company.description,
          logo_path: logoPath,
        }),
      })

      if (!res.ok) throw new Error("No se pudo actualizar el perfil")

      router.push("/dashboard/company/profile")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Error al actualizar el perfil")
    } finally {
      setLoading(false)
    }
  }

    const handleDelete = async () => {
        if (!company?.id) return
        setLoading(true)

        try {
            const res = await fetch("/api/company/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ company_id: company.id }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "No se pudo eliminar la empresa")

            await fetch("/api/company/logout", { method: "POST", credentials: "include" })

            router.push("/login")
        } catch (err: any) {
            console.error(err)
            alert(err.message || "Error al eliminar la empresa")
        } finally {
            setLoading(false)
            setDeleteDialogOpen(false)
        }
    }



  if (!company) return null

  return (
    <div className="max-w-2xl mx-auto py-8 relative">
      <Card>
        <CardHeader>
          <CardTitle>Editar perfil de empresa</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre comercial</Label>
              <Input
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Sector</Label>
              <Input
                value={company.sector}
                onChange={(e) =>
                  setCompany({ ...company, sector: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                rows={4}
                value={company.description}
                onChange={(e) =>
                  setCompany({ ...company, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Logo de la empresa (PNG/JPG, máximo 2MB)</Label>
              <Input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setLogoFile(e.target.files[0])
                  }
                }}
              />
            </div>

            <div className="flex gap-2 items-center">
                <Button type="submit" disabled={loading}>
                    Guardar cambios
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancelar
                </Button>

                {/* Botón de eliminar separado */}
                <Button
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                    onClick={(e) => {
                            e.preventDefault() // 🔹 evitar propagación al form
                            setDeleteDialogOpen(true)
                    }}                >
                    Eliminar empresa
                </Button>
            </div>



          </form>
        </CardContent>
      </Card>

      {/* Dialogo de confirmación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Está seguro de eliminar la empresa?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

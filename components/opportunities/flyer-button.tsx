"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"

export function FlyerButton({
  opportunityId,
  currentFlyerUrl
}: {
  opportunityId: string
  currentFlyerUrl?: string | null
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleViewFlyer = async () => {
    if (currentFlyerUrl) {
      // Si ya existe un flyer, abrirlo directamente
      window.open(currentFlyerUrl, '_blank')
    } else {
      // Si no existe, generar uno nuevo con Puppeteer
      setIsLoading(true)
      try {
        const response = await fetch(`/api/flyer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicacion_id: opportunityId })
        })

        if (!response.ok) {
          throw new Error('Error generando flyer')
        }

        const result = await response.json()
        
        if (result.success && result.data?.pdf_url) {
          // Abrir el PDF generado
          window.open(result.data.pdf_url, '_blank')
        } else {
          throw new Error('No se pudo generar el flyer')
        }
      } catch (error) {
        console.error('Error al generar flyer:', error)
        alert('Error al generar el flyer. Por favor intenta de nuevo.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Button
      variant="default"
      className="w-full"
      onClick={handleViewFlyer}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Ver Flyer
        </>
      )}
    </Button>
  )
}

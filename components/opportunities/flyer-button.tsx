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
      // Mostrar flyer personalizado
      window.open(currentFlyerUrl, '_blank')
    } else {
      // Generar y mostrar flyer automático
      setIsLoading(true)
      try {
        const response = await fetch(`/api/opportunities/${opportunityId}/generate-flyer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Error generando flyer')
        }

        const result = await response.json()
        if (result.success && result.data?.html) {
          const win = window.open('', '_blank')
          if (win) {
            win.document.write(result.data.html)
            win.document.close()
          }
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

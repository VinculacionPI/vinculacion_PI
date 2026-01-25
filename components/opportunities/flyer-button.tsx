"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export function FlyerButton({ 
  opportunityId, 
  currentFlyerUrl 
}: { 
  opportunityId: string
  currentFlyerUrl?: string | null 
}) {
  const handleViewFlyer = () => {
    if (currentFlyerUrl) {
      // Mostrar flyer personalizado
      window.open(currentFlyerUrl, '_blank')
    } else {
      // Generar y mostrar flyer automático
      import('@/lib/services/api').then(({ generarFlyer }) => {
        generarFlyer(opportunityId).then(result => {
          if (result.success) {
            const win = window.open('', '_blank')
            if (win) {
              win.document.write(result.data.html)
              win.document.close()
            }
          }
        })
      })
    }
  }

  return (
    <Button 
      variant="default" 
      className="w-full"
      onClick={handleViewFlyer}
    >
      <FileText className="h-4 w-4 mr-2" />
      Ver Flyer
    </Button>
  )
}
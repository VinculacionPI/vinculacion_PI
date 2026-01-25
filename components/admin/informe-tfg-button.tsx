"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Download } from "lucide-react"
import { generarInformeTFG } from "@/lib/services/api"

export function InformeTFGButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDescargarCSV = async () => {
    setIsGenerating(true)
    try {
      const result = await generarInformeTFG('CSV')
      
      if (result.success) {
        // Crear blob y descargar
        const blob = new Blob([result.data.contenido], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        alert(`Informe generado exitosamente!\n\nTotal TFGs: ${result.data.total_registros}`)
      } else {
        alert('Error generando informe: ' + result.error)
      }
    } catch (err) {
      console.error('Error generando informe:', err)
      alert('Error generando informe')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDescargarJSON = async () => {
    setIsGenerating(true)
    try {
      const result = await generarInformeTFG('JSON')
      
      if (result.success) {
        const blob = new Blob([result.data.contenido], { type: 'application/json;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        alert(`Informe generado exitosamente!\n\nTotal TFGs: ${result.data.total_registros}`)
      } else {
        alert('Error generando informe: ' + result.error)
      }
    } catch (err) {
      console.error('Error generando informe:', err)
      alert('Error generando informe')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleDescargarCSV}
        disabled={isGenerating}
        variant="default"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        {isGenerating ? 'Generando...' : 'Descargar CSV'}
      </Button>

      <Button 
        onClick={handleDescargarJSON}
        disabled={isGenerating}
        variant="outline"
      >
        <Download className="h-4 w-4 mr-2" />
        {isGenerating ? 'Generando...' : 'Descargar JSON'}
      </Button>
    </div>
  )
}
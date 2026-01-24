"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface UploadFlyerProps {
  opportunityId: string
  currentFlyerUrl?: string | null
  onUploadSuccess?: (url: string) => void
  compact?: boolean
}

export function UploadFlyer({ opportunityId, currentFlyerUrl, onUploadSuccess, compact = false }: UploadFlyerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError(null)
    setSuccess(false)

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      setFile(null)
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('El archivo no puede superar los 5MB')
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const fileName = `opp-${Date.now()}.pdf`
      
      const { error: uploadError } = await supabase.storage
        .from('flyers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('flyers')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('OPPORTUNITY')
        .update({ flyer_url: publicUrl })
        .eq('id', opportunityId)

      if (updateError) throw updateError

      setSuccess(true)
      setFile(null)
      
      if (onUploadSuccess) {
        onUploadSuccess(publicUrl)
      }
    } catch (err: any) {
      console.error('Error subiendo flyer:', err)
      setError(err.message || 'Error al subir el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  // Modo compacto para el formulario de creación
  if (compact) {
    return (
      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3 hover:border-primary transition-colors">
        <Upload className="h-8 w-8 text-primary" />
        <div className="text-center">
          <p className="font-semibold">Subir Flyer Personalizado</p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF hasta 5MB
          </p>
        </div>
        
        <Input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          className="max-w-xs"
        />
        
        {file && (
          <p className="text-xs text-muted-foreground">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        
        {success && (
          <p className="text-xs text-green-600">✓ Subido exitosamente</p>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? 'Subiendo...' : 'Subir PDF'}
        </Button>
      </div>
    )
  }

  // Modo normal (Card completo)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Flyer Manual
        </CardTitle>
        <CardDescription>
          Sube tu propio flyer en PDF (máximo 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentFlyerUrl && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <FileText className="h-4 w-4" />
              <span>Flyer actual disponible</span>
            </div>
            <a
              href={currentFlyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-500 hover:underline mt-1 block"
            >
              Ver flyer
            </a>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>Flyer subido exitosamente</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="flyer-upload">Seleccionar PDF</Label>
          <Input
            id="flyer-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Subiendo...' : 'Subir Flyer'}
        </Button>
      </CardContent>
    </Card>
  )
}
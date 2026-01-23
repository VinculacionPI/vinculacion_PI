"use client"

import { useState } from "react"

export function InterestToggle({
  opportunityId,
  lifecycleStatus,
  initialInterested,
  onChanged,
}: {
  opportunityId: string
  lifecycleStatus: string | null
  initialInterested: boolean
  onChanged?: (v: boolean) => void
}) {
  const [interested, setInterested] = useState(initialInterested)
  const [loading, setLoading] = useState(false)

  const isActive = lifecycleStatus === "ACTIVE"

  const toggle = async () => {
    if (!isActive) {
      alert("Esta publicación no está activa.")
      return
    }

    const ok = window.confirm(
      interested
        ? "¿Confirmas que deseas retirar tu manifestación de interés?"
        : "¿Confirmas que deseas manifestar interés en esta publicación?"
    )
    if (!ok) return

    setLoading(true)
    try {
      const res = await fetch("/api/interest", {
        method: interested ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
      })

      if (!res.ok) {
        const json = await res.json()
        if (json.error === "DUPLICATE") alert("Ya manifestaste interés.")
        else if (json.error === "INACTIVE") alert("Publicación no activa.")
        else if (res.status === 401) alert("Debes iniciar sesión.")
        else alert("Error al procesar la acción.")
        return
      }

      const next = !interested
      setInterested(next)
      onChanged?.(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !isActive}
      className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
      title={!isActive ? "Publicación no activa" : undefined}
    >
      {loading
        ? "Procesando..."
        : interested
        ? "Retirar interés"
        : "Manifestar interés"}
    </button>
  )
}

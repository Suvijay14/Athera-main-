'use client'

import { useCallback, useEffect, useState } from 'react'

export function useIntegrations() {
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailEmail, setGmailEmail] = useState('')
  const [canvasConnected, setCanvasConnected] = useState(false)
  const [canvasName, setCanvasName] = useState('')
  const [canvasLoginId, setCanvasLoginId] = useState('')
  const [canvasDaysRemaining, setCanvasDaysRemaining] = useState(0)
  const [canvasNeedsRelink, setCanvasNeedsRelink] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshGmail = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/gmail/status')
      if (!res.ok) return
      const data = (await res.json()) as { connected: boolean; email: string }
      setGmailConnected(data.connected)
      setGmailEmail(data.email ?? '')
    } catch {
      setGmailConnected(false)
      setGmailEmail('')
    }
  }, [])

  const refreshCanvas = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/canvas/status')
      if (!res.ok) return
      const data = (await res.json()) as {
        connected: boolean
        name: string
        loginId: string
        daysRemaining: number
        needsRelink: boolean
      }
      setCanvasConnected(data.connected)
      setCanvasName(data.name ?? '')
      setCanvasLoginId(data.loginId ?? '')
      setCanvasDaysRemaining(data.daysRemaining ?? 0)
      setCanvasNeedsRelink(data.needsRelink ?? false)
    } catch {
      setCanvasConnected(false)
      setCanvasName('')
      setCanvasLoginId('')
      setCanvasDaysRemaining(0)
      setCanvasNeedsRelink(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([refreshGmail(), refreshCanvas()])
    setLoading(false)
  }, [refreshGmail, refreshCanvas])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    loading,
    gmailConnected,
    gmailEmail,
    canvasConnected,
    canvasName,
    canvasLoginId,
    canvasDaysRemaining,
    canvasNeedsRelink,
    refresh,
    refreshGmail,
    refreshCanvas,
  }
}

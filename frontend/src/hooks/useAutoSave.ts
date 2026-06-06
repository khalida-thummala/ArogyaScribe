/**
 * useAutoSave — saves the in-progress transcript to the backend every 30 seconds.
 * - Skips the request if transcript hasn't changed since last save.
 * - On pause: does one final save, then suspends the interval.
 * - On resume: restarts the interval.
 * - On network failure: enqueues to IndexedDB offline queue.
 */

import { useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { enqueue } from '@/lib/offlineQueue'

const INTERVAL_MS = 30_000

interface Options {
  consultationId: string
  getTranscript: () => string
  enabled: boolean   // true while recording or paused (not after stop)
}

export function useAutoSave({ consultationId, getTranscript, enabled }: Options) {
  const intervalRef    = useRef<number | null>(null)
  const lastSavedRef   = useRef<string>('')

  const doSave = useCallback(async () => {
    const current = getTranscript()
    if (!current || current === lastSavedRef.current) return  // nothing new

    const apiPayload = {
      transcription_text: current,
      updated_at: new Date().toISOString(),
    }

    const queueEntry = {
      consultationId,
      transcriptionText: current,
      updatedAt: new Date().toISOString(),
    }

    if (!navigator.onLine) {
      // Offline — queue immediately without attempting network
      await enqueue(queueEntry)
      console.log('[AutoSave] Offline — queued draft')
      return
    }

    try {
      await apiClient.patch(`/consultations/${consultationId}/draft`, apiPayload)
      lastSavedRef.current = current
      console.log('[AutoSave] Draft saved')
    } catch (err) {
      console.warn('[AutoSave] Save failed — queuing:', err)
      await enqueue(queueEntry)
      toast.error('Auto-save failed — queued locally', { id: 'autosave-fail' })
    }
  }, [consultationId, getTranscript])

  const startInterval = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = window.setInterval(doSave, INTERVAL_MS)
  }, [doSave])

  const stopInterval = useCallback(async (finalSave = true) => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (finalSave) await doSave()
  }, [doSave])

  // Start/stop interval based on enabled flag
  useEffect(() => {
    if (enabled) {
      startInterval()
    } else {
      stopInterval(false)
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, startInterval, stopInterval])

  return { saveNow: doSave }
}

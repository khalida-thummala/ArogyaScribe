/**
 * Sync Manager — flushes the offline queue when connectivity is restored.
 * Call initSyncManager() once at app startup (e.g. in main.tsx or App.tsx).
 */

import { getAll, dequeue } from './offlineQueue'
import { apiClient } from '@/api/client'
import { getOfflineRecordings, removeOfflineRecording } from '@/offline/offlineStorage'
import { dictationApi } from '@/api/dictation'
import toast from 'react-hot-toast'

async function flushDrafts(): Promise<void> {
  const entries = await getAll()
  if (entries.length === 0) return

  console.log(`[SyncManager] Flushing ${entries.length} queued save(s)...`)

  for (const entry of entries) {
    try {
      await apiClient.patch(
        `/consultations/${entry.consultationId}/draft`,
        {
          transcription_text: entry.transcriptionText,
          updated_at: entry.updatedAt,
        }
      )
      await dequeue(entry.id!)
      console.log(`[SyncManager] Flushed entry id=${entry.id}`)
    } catch (err) {
      // Keep in queue — will retry on next online event
      console.warn(`[SyncManager] Failed to flush entry id=${entry.id}:`, err)
    }
  }
}

async function syncOfflineDictations(): Promise<void> {
  const recordings = await getOfflineRecordings()
  if (recordings.length === 0) return

  console.log(`[SyncManager] Syncing ${recordings.length} offline dictations...`)
  toast(`Syncing ${recordings.length} offline recording(s)...`, { icon: '🔄' })

  let successCount = 0

  for (const rec of recordings) {
    try {
      // 1. Transcribe & generate report
      const res = await dictationApi.transcribeAndReport(rec.audioBlob, rec.letterhead, rec.patientContext)
      
      if (res.success && res.report) {
        // 2. Save the report to backend so it shows up in history
        await dictationApi.save(res.report, rec.letterhead, null, rec.patientId)
        
        // 3. Remove from IDB
        await removeOfflineRecording(rec.id)
        successCount++
      } else {
        console.warn('[SyncManager] Failed to generate report for', rec.id, res.error)
      }
    } catch (err) {
      console.error(`[SyncManager] Sync failed for ${rec.id}:`, err)
    }
  }

  if (successCount > 0) {
    toast.success(`Successfully synced ${successCount} offline dictation(s) and generated reports!`)
  }
}

export function initSyncManager(): () => void {
  const handler = () => {
    console.log('[SyncManager] Online — flushing queues')
    flushDrafts()
    syncOfflineDictations()
  }

  window.addEventListener('online', handler)

  // Also flush immediately in case we're already online with queued items
  if (navigator.onLine) {
    flushDrafts()
    syncOfflineDictations()
  }

  // Return cleanup function
  return () => window.removeEventListener('online', handler)
}

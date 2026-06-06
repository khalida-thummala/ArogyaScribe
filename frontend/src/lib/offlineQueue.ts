/**
 * IndexedDB-backed offline queue.
 * Persists save payloads across page reloads so nothing is lost on accidental refresh.
 */

const DB_NAME  = 'arogyascribe-offline'
const DB_VER   = 1
const STORE    = 'queue'

export interface QueueEntry {
  id?: number          // auto-increment key
  consultationId: string
  transcriptionText: string
  updatedAt: string    // ISO-8601
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

export async function enqueue(entry: Omit<QueueEntry, 'id'>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).add(entry)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export async function dequeue(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(id)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export async function getAll(): Promise<QueueEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as QueueEntry[])
    req.onerror   = () => reject(req.error)
  })
}

import { openDB } from 'idb'

const DB_NAME = 'arogyascribe_offline'
const STORE_NAME = 'recordings'

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    },
  })
}

export async function saveOfflineRecording(data: any) {
  const db = await getDB()
  await db.put(STORE_NAME, data)
}

export async function getOfflineRecordings() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function removeOfflineRecording(id: string) {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function clearOfflineRecordings() {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
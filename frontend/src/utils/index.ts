import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function calcAge(dob: string): number {
  if (!dob) return 0
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export function fileSizeMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

/** Truncates a UUID to first N chars with ellipsis */
export function truncateId(id: string, n = 8): string {
  return id ? id.slice(0, n) + '…' : '—'
}

/** Capitalizes first letter of a string */
export function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Returns Badge variant based on status string */
export function statusToVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    active: 'success',
    completed: 'success',
    approved: 'success',
    signed: 'success',
    in_progress: 'warning',
    draft: 'warning',
    pending: 'warning',
    cancelled: 'danger',
    failed: 'danger',
    archived: 'default',
    inactive: 'default',
    info: 'info',
  }
  return map[status] ?? 'default'
}

/** Converts base64 string to a Blob for upload */
export function base64ToBlob(base64: string, mimeType = 'audio/webm'): Blob {
  const byteChars = atob(base64)
  const byteNums = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
  return new Blob([new Uint8Array(byteNums)], { type: mimeType })
}

/**
 * Converts a SOAP field value into clean, human-readable text.
 *
 * The AI sometimes returns nested JSON objects for SOAP sections
 * (e.g. subjective = { chief_complaint: "...", history_of_present_illness: "..." }).
 * This function flattens those into readable "Label: value" lines.
 *
 * Handles:
 *   - Plain strings          → returned as-is
 *   - JSON-encoded strings   → parsed then formatted
 *   - Plain objects          → "Key: value" per entry
 *   - Arrays                 → items joined with newlines
 *   - null / undefined       → empty string
 */
export function formatSoapField(raw: unknown): string {
  if (raw === null || raw === undefined) return ''

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return ''
    // Try to parse as JSON — backend sometimes stores objects as JSON strings
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return formatSoapField(JSON.parse(trimmed))
      } catch {
        return trimmed
      }
    }
    return trimmed
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'object' && item !== null ? formatSoapField(item) : String(item)))
      .filter(Boolean)
      .join('\n')
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => {
        // snake_case / camelCase → Title Case label
        const label = k
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        const value = Array.isArray(v)
          ? (v as unknown[])
              .map((item) => (typeof item === 'object' && item !== null ? formatSoapField(item) : String(item)))
              .join(', ')
          : typeof v === 'object' && v !== null
          ? formatSoapField(v)
          : String(v)
        return `${label}: ${value}`
      })
      .join('\n')
  }

  return String(raw)
}

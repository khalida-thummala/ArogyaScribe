import { useCallback, useState } from 'react'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (err: any) => void
  successMessage?: string
  errorMessage?: string
}

/**
 * useApiMutation — lightweight wrapper around an API call with loading + error state.
 */
export function useApiMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  options: UseApiOptions<TResult> = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TResult | null>(null)

  const execute = useCallback(async (args: TArgs) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fn(args)
      setData(result)
      if (options.successMessage) toast.success(options.successMessage)
      options.onSuccess?.(result)
      return result
    } catch (err: any) {
      const msg = err.response?.data?.detail || options.errorMessage || 'An error occurred'
      setError(msg)
      toast.error(msg)
      options.onError?.(err)
    } finally {
      setIsLoading(false)
    }
  }, [fn, options])

  return { execute, isLoading, error, data }
}

/**
 * useFileDownload — triggers a file download from a URL or Blob.
 */
export function useFileDownload() {
  const download = useCallback((url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    download(url, filename)
  }, [download])

  const downloadFromApi = useCallback(async (endpoint: string, filename: string) => {
    try {
      const response = await apiClient.get(endpoint, { responseType: 'blob' })
      downloadBlob(response.data, filename)
      toast.success(`${filename} downloaded`)
    } catch {
      toast.error('Download failed')
    }
  }, [downloadBlob])

  return { download, downloadBlob, downloadFromApi }
}

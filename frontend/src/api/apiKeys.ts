import { apiClient } from './client'

export interface APIKey {

  api_key_id: string

  key: string

  name: string

  is_active: boolean

  created_at: string

  request_count: number

  last_used_at?: string
}

export const apiKeysApi = {

  generateKey: () => {

    return apiClient.post(

      '/api-keys/generate'

    ).then((r) => r.data)
  },

  getKeys: () => {

    return apiClient.get<APIKey[]>(

      '/api-keys'

    ).then((r) => r.data)
  },

  revokeKey: (
    apiKeyId: string
  ) => {

    return apiClient.post(

      `/api-keys/${apiKeyId}/revoke`

    ).then((r) => r.data)
  }
}
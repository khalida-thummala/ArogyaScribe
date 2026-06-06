import { apiClient } from './client'

export interface ReportTemplate {
  template_id: string;
  name: string;
  type_key: string;
  description: string;
  schema_json: any;
  is_active: boolean;
}

export const reportTemplatesApi = {
  list: async () => {
    const { data } = await apiClient.get<ReportTemplate[]>('/report-templates')
    return data
  }
}

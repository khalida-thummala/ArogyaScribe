import { apiClient } from './client'

export const adminApi = {
  getOrganizations: () =>
    apiClient.get('/admin/organizations').then((r) => r.data),

  createOrganization: (data: any) =>
    apiClient.post('/admin/organizations', data).then((r) => r.data),

  getDoctors: () =>
  apiClient.get('/admin/doctors').then((r) => r.data),

  getDoctorPatients: (doctorId: string) =>
  apiClient
    .get(`/admin/doctors/${doctorId}/patients`)
    .then((r) => r.data),

  getPatients: () =>
  apiClient.get('/admin/patients').then((r) => r.data),

  getSubscriptions: () =>
  apiClient.get('/admin/subscriptions').then((r) => r.data),

createSubscription: (data: any) =>
  apiClient.post('/admin/subscriptions', data).then((r) => r.data),

updateSubscription: (
  subscriptionId: string,
  data: any
) =>
  apiClient.put(
    `/admin/subscriptions/${subscriptionId}`,
    data
  ).then((r) => r.data),

  getUsage: () =>
  apiClient.get('/admin/usage').then((r) => r.data),

  getUpgradeRequests: () =>
  apiClient.get('/admin/upgrade-requests').then((r) => r.data),


approveUpgradeRequest: (requestId: string) =>
  apiClient.put(
    `/admin/upgrade-requests/${requestId}/approve`
  ).then((r) => r.data),

  getDashboard: () =>
  apiClient.get('/admin/dashboard').then((r) => r.data),

  getPatientConsultations: (patientId: string) =>
  apiClient
    .get(`/admin/patients/${patientId}/consultations`)
    .then((r) => r.data),

    getOrganizationDashboard: () =>
  apiClient
    .get('/admin/organization/dashboard')
    .then((r) => r.data),

    getOrganizationDoctors: () =>
  apiClient
    .get('/admin/organization/doctors')
    .then((r) => r.data),

updateDoctorStatus: (
  doctorId: string,
  status: string
) =>
  apiClient
    .put(
      `/admin/organization/doctors/${doctorId}/status?status=${status}`
    )
    .then((r) => r.data),

    getOrganizationPatients: () =>
  apiClient
    .get('/admin/organization/patients')
    .then((r) => r.data),


    getOrganizationReports: () =>
  apiClient
    .get('/admin/organization/reports')
    .then((r) => r.data),

    getOrganizationUsage: () =>
  apiClient
    .get('/admin/organization/usage')
    .then((r) => r.data),

    getOrganizationSubscription: () =>
  apiClient
    .get('/admin/organization/subscription')
    .then((r) => r.data),

    createOrganizationDoctor: (data: any) =>
  apiClient
    .post(
      '/admin/organization/doctors',
      data
    )
    .then((r) => r.data),


    getOrganizationSettings: () =>
  apiClient
    .get('/admin/organization/settings')
    .then((r) => r.data),

updateOrganizationSettings: (
  data: any
) =>
  apiClient
    .put(
      '/admin/organization/settings',
      data
    )
    .then((r) => r.data),

    getDoctorDetails: (
  doctorId: string
) =>
  apiClient
    .get(
      `/admin/organization/doctors/${doctorId}`
    )
    .then((r) => r.data),


    updateDoctor: (
  doctorId: string,
  data: any
) =>
  apiClient.put(
    `/admin/organization/doctors/${doctorId}`,
    data
  ).then((r) => r.data),

  resetDoctorPassword: (
  doctorId: string,
  password: string
) =>
  apiClient.put(
    `/admin/organization/doctors/${doctorId}/reset-password`,
    { password }
  ).then((r) => r.data),

  

  changeOrganizationPassword: (
  current_password: string,
  new_password: string
) =>
  apiClient.put(
    "/admin/organization/change-password",
    {
      current_password,
      new_password
    }
  ).then((r) => r.data),

  getOrganizationDetails: (organizationId: string) =>
  apiClient
    .get(`/admin/organizations/${organizationId}`)
    .then((r) => r.data),


    createUpgradeRequest: (data: any) =>
  apiClient
    .post('/admin/upgrade-requests', data)
    .then((r) => r.data),

  

  resetOrganizationAdminPassword: (
    organizationId: string,
    password: string
  ) =>
    apiClient.put(
      `/admin/organizations/${organizationId}/reset-password`,
      { password }
    ).then((r) => r.data),

}


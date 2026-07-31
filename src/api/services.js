import client from './client'

export const authApi = {
  login: (username, password) =>
    client.post('/auth/login/', { username, password }),
  me: () => client.get('/auth/me/'),
}

export const mapApi = {
  config: () => client.get('/map-config/'),
  geojson: (params) => client.get('/lands/geojson/', { params }),
  boundary: () => client.get('/boundaries/geojson/'),
}

export { fetchMapSnapshot, fetchMapBoundaries, fetchMapFeatures, fetchMapConfig } from './mapData'

export const landsApi = {
  list: (params) => client.get('/lands/', { params }),
  get: (id) => client.get(`/lands/${id}/`),
  create: (data) => client.post('/lands/', data),
  update: (id, data) => client.put(`/lands/${id}/`, data),
  delete: (id) => client.delete(`/lands/${id}/`),
  history: (id) => client.get(`/lands/${id}/history/`),
  versions: (id) => client.get(`/lands/${id}/versions/`),
}

export const categoriesApi = {
  list: () => client.get('/categories/'),
}

export const statsApi = {
  get: () => client.get('/statistics/'),
  dashboard: (params) => client.get('/dashboard/', { params }),
  compare: (params) => client.get('/compare/', { params }),
  urbanization: (params) => client.get('/urbanization/', { params }),
  exportExcel: (params) =>
    client.get('/export/excel/', { params, responseType: 'blob' }),
}

export const monitoringApi = {
  issues: (params) => client.get('/monitoring/issues/', { params }),
  createIssue: (data) => client.post('/monitoring/issues/', data),
  updateIssue: (id, data) => client.patch(`/monitoring/issues/${id}/`, data),
  changes: (params) => client.get('/monitoring/changes/', { params }),
  years: (params) => client.get('/monitoring-years/', { params }),
  records: (params) => client.get('/monitoring-records/', { params }),
}

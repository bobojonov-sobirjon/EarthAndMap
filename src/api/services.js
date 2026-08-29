import client from './client'

export const authApi = {
  login: (username, password) =>
    client.post('/auth/login/', { username, password }),
  register: (payload) => client.post('/auth/register/', payload),
  me: () => client.get('/auth/me/'),
}

export const mapApi = {
  config: () => client.get('/map-config/'),
  geojson: (params) => client.get('/lands/geojson/', { params }),
  boundary: () => client.get('/boundaries/geojson/'),
  mahallas: (params) => client.get('/mahallas/', { params }),
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
  parseGeometry: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post('/lands/parse_geometry/', fd, { timeout: 120000 })
  },
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
  deleteIssue: (id) => client.delete(`/monitoring/issues/${id}/`),
  changes: (params) => client.get('/monitoring/changes/', { params }),
  years: (params) => client.get('/monitoring-years/', { params }),
  records: (params) => client.get('/monitoring-records/', { params }),
}

/** Админ-панель CRUD API */
function crud(base) {
  return {
    list: (params) => client.get(`${base}/`, { params }),
    get: (id) => client.get(`${base}/${id}/`),
    create: (data) => client.post(`${base}/`, data),
    update: (id, data) => client.put(`${base}/${id}/`, data),
    patch: (id, data) => client.patch(`${base}/${id}/`, data),
    remove: (id) => client.delete(`${base}/${id}/`),
  }
}

export const adminApi = {
  users: crud('/auth/users'),
  categories: crud('/categories'),
  lands: crud('/lands'),
  boundaries: crud('/boundaries'),
  mahallas: crud('/mahallas'),
  notices: crud('/notices'),
  years: crud('/monitoring-years'),
  versions: crud('/object-versions'),
  records: crud('/monitoring-records'),
  urbanization: crud('/urbanization-layers'),
  issues: crud('/monitoring/issues'),
  changes: {
    list: (params) => client.get('/monitoring/changes/', { params }),
    get: (id) => client.get(`/monitoring/changes/${id}/`),
  },
  attachments: crud('/attachments'),
}


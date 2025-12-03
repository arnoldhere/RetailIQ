import client from './auth'

export async function getOverview() {
  return client.get('/api/admin/overview')
}

export default { getOverview }

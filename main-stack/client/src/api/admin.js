import client from './auth'

export async function getOverview() {
  return client.get('/api/admin/overview')
}

export async function getUsers(){
  return client.get("/api/admin/get-users")
}

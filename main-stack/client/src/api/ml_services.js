import client from './base'

export async function recommendation(id) {
    return client.post("/api/")
}

export default client

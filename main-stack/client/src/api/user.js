import client from './base'

export async function getWishlist() {
    return client.get("/api/user/get-wishlist")
}

export async function submitFeedback(data) {
    return client.post('/api/user/feedback', data);
}

export async function getMetrics() {
    return client.get('/api/user/getMetrics');
}

export async function editProfile(data, id) {
    return client.post(`/api/user/edit-profile/${id}`, data)
}

export async function getSupplierProfile() {
    return client.get(`/api/user/supplier-profile`)
}

export async function updateSupplierProfile(data) {
    return client.put(`/api/user/supplier/profile`, data)
}

export async function getAboutusStat() {
    return client.get("/api/user/get-aboutus-stat")
}

export default client;

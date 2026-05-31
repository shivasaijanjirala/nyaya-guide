import axios from 'axios'
import useAuthStore from '../store/authStore'

/**
 * Axios instance pre-configured for the NyayaGuide API.
 * - Automatically attaches JWT token to every request
 * - Handles 401 responses by logging the user out
 * - Base URL points to the FastAPI backend via Vite's proxy
 */
const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // Send secure cookies for CSRF
})

// ── Request interceptor: attach JWT & handle FormData ──
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    // Let the browser set the correct Content-Type (with boundary) for file uploads
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
    }
    return config
})

// ── Response interceptor: handle auth errors ──
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

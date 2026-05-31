import { create } from 'zustand'

/**
 * Auth store – manages JWT tokens, user profile, and login state.
 * Uses Zustand for lightweight, framework-agnostic reactive state.
 *
 * WHY Zustand? Unlike Redux, no boilerplate. Unlike Context, no re-render issues.
 */
const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('nyaya_token') || null,
    isAuthenticated: !!localStorage.getItem('nyaya_token'),
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

    setToken: (token) => {
        localStorage.setItem('nyaya_token', token)
        set({ token, isAuthenticated: true })
    },

    logout: () => {
        localStorage.removeItem('nyaya_token')
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    },

    setLoading: (isLoading) => set({ isLoading }),
}))

export default useAuthStore

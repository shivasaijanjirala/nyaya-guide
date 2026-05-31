import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import toast from 'react-hot-toast'

/* ── Google Sign-In ──────────────────────────────────────────────── */
function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
        </svg>
    )
}
/* ────────────────────────────────────────────────────────────────── */

export default function LoginPage() {
    const [step, setStep] = useState('email') // 'email' | 'otp'
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const navigate = useNavigate()
    const { setToken, setUser } = useAuthStore()

    const googleBtnRef = useRef(null)

    const handleSendOtp = async (e) => {
        e.preventDefault()
        if (!email) return toast.error('Please enter your email')
        setLoading(true)
        try {
            const res = await api.post('/auth/send-otp', { email })
            toast.success('OTP sent to your email!')
            setStep('otp')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        if (!otp) return toast.error('Please enter the OTP')
        setLoading(true)
        try {
            const res = await api.post('/auth/verify-otp', { email, otp })
            setToken(res.data.token)
            setUser(res.data.user)
            toast.success('Welcome back!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid OTP')
        } finally {
            setLoading(false)
        }
    }

    // Wait for Google script to load and render the official button directly
    useEffect(() => {
        if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return

        const checkGoogle = setInterval(() => {
            if (window.google) {
                clearInterval(checkGoogle)
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    use_fedcm_for_prompt: false,
                    callback: async (response) => {
                        setGoogleLoading(true)
                        try {
                            const res = await api.post('/auth/google', { id_token: response.credential })
                            setToken(res.data.token)
                            setUser(res.data.user)
                            toast.success(res.data.is_new ? 'Welcome to NyayaGuide!' : 'Welcome back!')
                            navigate('/dashboard')
                        } catch (err) {
                            toast.error(err.response?.data?.detail || 'Google Login failed')
                        } finally {
                            setGoogleLoading(false)
                        }
                    },
                })

                if (googleBtnRef.current) {
                    window.google.accounts.id.renderButton(googleBtnRef.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        width: '100%',
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'center'
                    })
                }
            }
        }, 100)

        return () => clearInterval(checkGoogle)
    }, [navigate, setToken, setUser])

    return (
        <div className="min-h-screen flex items-center justify-center bg-navy-900 gradient-mesh px-4">
            {/* Decorative */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 justify-center mb-8">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Scale className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-display font-bold text-2xl text-white">NyayaGuide</span>
                </Link>

                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <h1 className="font-display font-bold text-2xl text-white mb-2">
                            {step === 'email' ? 'Welcome Back' : 'Enter OTP'}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {step === 'email'
                                ? 'Sign in with your email or continue with Google.'
                                : `We sent a 6-digit code to ${email}`}
                        </p>
                    </div>

                    {step === 'email' ? (
                        <>
                            {/* ── Official Google Sign-In Button Container ── */}
                            <div className="mb-5 flex justify-center w-full min-h-[40px]">
                                <div ref={googleBtnRef} className="w-full"></div>
                            </div>


                            {/* ── Divider ── */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-gray-500 font-medium">or sign in with email</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* ── Email OTP Form ── */}
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label className="input-label">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="input-field !pl-12"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        </>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="input-label">6-Digit OTP</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="••••••"
                                        className="input-field !pl-12 text-center tracking-[0.5em] text-xl font-semibold"
                                        maxLength={6}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Login <ArrowRight className="w-4 h-4" /></>}
                            </button>
                            <button type="button" onClick={() => setStep('email')} className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors">
                                ← Use a different email
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                    🔒 Your data is encrypted end-to-end. DPDP Act compliant.
                </p>
            </div>
        </div>
    )
}

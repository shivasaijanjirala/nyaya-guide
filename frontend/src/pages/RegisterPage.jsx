import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, Mail, User, Phone, ArrowRight, Loader2, KeyRound, ShieldCheck } from 'lucide-react'
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

export default function RegisterPage() {
    const [step, setStep] = useState('details') // 'details' | 'consent' | 'otp'
    const [form, setForm] = useState({ name: '', email: '', phone: '', language_preference: 'en' })
    const [otp, setOtp] = useState('')
    const [consent, setConsent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const navigate = useNavigate()
    const { setToken, setUser } = useAuthStore()

    const googleBtnRef = useRef(null)

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

    const update = (key, val) => setForm((p) => ({ ...p, [key]: val }))

    const handleConsent = () => {
        if (!form.name || !form.email) return toast.error('Please fill all required fields')
        setStep('consent')
    }

    const handleSendOtp = async () => {
        if (!consent) return toast.error('You must provide consent to proceed')
        setLoading(true)
        try {
            const res = await api.post('/auth/register', { ...form, consent: true })
            toast.success('OTP sent!')
            setStep('otp')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await api.post('/auth/verify-otp', { email: form.email, otp })
            setToken(res.data.token)
            setUser(res.data.user)
            toast.success('Welcome to NyayaGuide!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-navy-900 gradient-mesh px-4 py-12">
            <div className="absolute top-20 right-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                <Link to="/" className="flex items-center gap-3 justify-center mb-8">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Scale className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-display font-bold text-2xl text-white">NyayaGuide</span>
                </Link>

                <div className="glass-card p-8">
                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {['Details', 'Consent', 'Verify'].map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${(i === 0 && step === 'details') || (i === 1 && step === 'consent') || (i === 2 && step === 'otp')
                                    ? 'gradient-primary text-white'
                                    : 'bg-white/10 text-gray-400'
                                    }`}>{i + 1}</div>
                                <span className="text-xs text-gray-400 hidden sm:inline">{s}</span>
                                {i < 2 && <div className="w-8 h-px bg-white/10" />}
                            </div>
                        ))}
                    </div>

                    {step === 'details' && (
                        <div className="space-y-5">
                            <h2 className="font-display font-bold text-xl text-white text-center mb-2">Create Account</h2>

                            {/* ── Official Google Sign-In Button Container ── */}
                            <div className="mb-5 flex justify-center w-full min-h-[40px]">
                                <div ref={googleBtnRef} className="w-full"></div>
                            </div>

                            {/* ── Divider ── */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-gray-500 font-medium">or register with email</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            <div>
                                <label className="input-label">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your full name" className="input-field !pl-12" required />
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Email Address *</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className="input-field !pl-12" required />
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Phone (Optional)</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" className="input-field !pl-12" />
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Preferred Language</label>
                                <select value={form.language_preference} onChange={(e) => update('language_preference', e.target.value)} className="input-field">
                                    <option value="en">English</option>
                                    <option value="hi">हिंदी (Hindi)</option>
                                    <option value="te">తెలుగు (Telugu)</option>
                                </select>
                            </div>
                            <button onClick={handleConsent} className="btn-primary w-full flex items-center justify-center gap-2">
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}


                    {step === 'consent' && (
                        <div className="space-y-5">
                            <div className="text-center mb-4">
                                <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <h2 className="font-display font-bold text-xl text-white mb-1">Data Consent</h2>
                                <p className="text-sm text-gray-400">As per India's DPDP Act, 2023</p>
                            </div>
                            <div className="glass-card p-4 text-sm text-gray-300 space-y-3 max-h-60 overflow-y-auto">
                                <p><strong className="text-white">Purpose of Data Collection:</strong> Your personal data will be used solely to provide legal information services, manage your profile, store your documents securely, and improve our AI assistance.</p>
                                <p><strong className="text-white">Data We Collect:</strong> Name, email, phone (optional), uploaded documents, chat messages, and consents.</p>
                                <p><strong className="text-white">Encryption:</strong> All sensitive fields are encrypted using AES-256 at rest. Documents are stored in encrypted cloud storage.</p>
                                <p><strong className="text-white">Your Rights (DPDP Act):</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    <li>Right to access your data at any time</li>
                                    <li>Right to correction of inaccurate data</li>
                                    <li>Right to erasure (delete your account & all data)</li>
                                    <li>Right to export your data</li>
                                    <li>Right to withdraw consent</li>
                                </ul>
                                <p><strong className="text-white">Data Sharing:</strong> We will NEVER share your data with third parties without your explicit consent.</p>
                            </div>
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-5 h-5 rounded accent-primary-500" />
                                <span className="text-sm text-gray-300">
                                    I have read and understood the data usage policy. I provide my explicit consent for NyayaGuide to collect and process my personal data as described above.
                                </span>
                            </label>
                            <button onClick={handleSendOtp} className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading || !consent}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Accept & Send OTP <ArrowRight className="w-4 h-4" /></>}
                            </button>
                            <button onClick={() => setStep('details')} className="w-full text-sm text-gray-400 hover:text-white text-center transition-colors">
                                ← Back to details
                            </button>
                        </div>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerify} className="space-y-5">
                            <div className="text-center mb-4">
                                <h2 className="font-display font-bold text-xl text-white mb-1">Verify Email</h2>
                                <p className="text-sm text-gray-400">Enter the 6-digit code sent to {form.email}</p>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" className="input-field !pl-12 text-center tracking-[0.5em] text-xl font-semibold" maxLength={6} autoFocus required />
                            </div>
                            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

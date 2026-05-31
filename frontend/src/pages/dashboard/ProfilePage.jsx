import { useState, useEffect } from 'react'
import { User, Mail, Phone, Calendar, Globe, Save, Loader2, Trash2, Download, Shield } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
    const { user, setUser } = useAuthStore()
    const [form, setForm] = useState({
        name: '', email: '', phone: '', dob: '', gender: '', address: '', language_preference: 'en'
    })
    const [loading, setLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                dob: user.dob || '',
                gender: user.gender || '',
                address: user.address || '',
                language_preference: user.language_preference || 'en',
            })
        }
    }, [user])

    const update = (key, val) => setForm((p) => ({ ...p, [key]: val }))

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await api.put('/users/profile', form)
            setUser(res.data.user)
            toast.success('Profile updated!')
        } catch (err) {
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleExportData = async () => {
        try {
            const res = await api.get('/users/export-data', { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = 'nyayaguide_my_data.json'
            a.click()
            toast.success('Data exported successfully!')
        } catch {
            toast.error('Export failed')
        }
    }

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/users/delete-account')
            toast.success('Account and all data deleted.')
            useAuthStore.getState().logout()
        } catch {
            toast.error('Deletion failed')
        }
    }

    return (
        <div className="max-w-3xl space-y-8 animate-fade-in">
            <div>
                <h1 className="font-display font-bold text-2xl text-white mb-1">My Profile</h1>
                <p className="text-gray-400 text-sm">Manage your personal information. All sensitive fields are encrypted.</p>
            </div>

            <div className="glass-card p-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label className="input-label">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field !pl-12" />
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Email (read-only)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input value={form.email} readOnly className="input-field !pl-12 opacity-60 cursor-not-allowed" />
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91" className="input-field !pl-12" />
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Date of Birth</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} className="input-field !pl-12" />
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Gender</label>
                        <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="input-field">
                            <option value="">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Language</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select value={form.language_preference} onChange={(e) => update('language_preference', e.target.value)} className="input-field !pl-12">
                                <option value="en">English</option>
                                <option value="hi">हिंदी</option>
                                <option value="te">తెలుగు</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="input-label">Address</label>
                    <textarea value={form.address} onChange={(e) => update('address', e.target.value)} className="input-field min-h-[80px]" placeholder="Your address (encrypted at rest)" />
                </div>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Profile</>}
                </button>
            </div>

            {/* DPDP Rights Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-green-400" />
                    <h2 className="font-display font-semibold text-lg text-white">Your Data Rights (DPDP Act)</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                    <button onClick={handleExportData} className="btn-secondary flex items-center gap-2 !py-3">
                        <Download className="w-5 h-5" /> Export My Data
                    </button>
                    {!deleteConfirm ? (
                        <button onClick={() => setDeleteConfirm(true)} className="btn-danger flex items-center gap-2 !py-3">
                            <Trash2 className="w-5 h-5" /> Delete My Account
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={handleDeleteAccount} className="btn-danger flex-1 !py-3 text-sm">
                                Confirm Delete
                            </button>
                            <button onClick={() => setDeleteConfirm(false)} className="btn-secondary flex-1 !py-3 text-sm">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-3">Deleting your account will permanently remove all data, documents, chats, and consents.</p>
            </div>
        </div>
    )
}

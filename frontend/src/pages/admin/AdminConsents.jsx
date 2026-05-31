import { useState, useEffect } from 'react'
import { ShieldCheck, Loader2, User, Calendar, CheckCircle } from 'lucide-react'
import api from '../../lib/api'

export default function AdminConsents() {
    const [consents, setConsents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchConsents() }, [])

    const fetchConsents = async () => {
        try { const res = await api.get('/admin/consents'); setConsents(res.data.consents || []) }
        catch { /* empty */ } finally { setLoading(false) }
    }

    const sampleConsents = [
        { id: '1', user_email: 'demo@example.com', user_name: 'Rajesh Kumar', consent_text: 'Data processing consent for legal information services', granted_at: '2026-02-28T20:00:00Z' },
        { id: '2', user_email: 'user2@example.com', user_name: 'Priya Sharma', consent_text: 'Data processing consent for legal information services', granted_at: '2026-02-27T15:00:00Z' },
        { id: '3', user_email: 'user3@example.com', user_name: 'Amit Patel', consent_text: 'Google Calendar read-only access consent', granted_at: '2026-02-26T10:00:00Z' },
    ]

    const displayConsents = consents.length > 0 ? consents : sampleConsents

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display font-bold text-2xl text-white">Consent Management</h1>
                <p className="text-gray-400 text-sm">View all user consents as required by the DPDP Act, 2023.</p>
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" /></div>
            ) : (
                <div className="grid gap-3">
                    {displayConsents.map((c) => (
                        <div key={c.id || c._id} className="glass-card p-4 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{c.user_name || c.user_email}</p>
                                <p className="text-sm text-gray-400">{c.consent_text}</p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Granted: {new Date(c.granted_at).toLocaleString()}
                                </p>
                            </div>
                            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
